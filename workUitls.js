// ==UserScript==
// @name         workUitls
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  工作用的工具箱（安灯为主）
// @author       You
// @match        andon.oa.com/workbench/director/*
// @match        andon.cloud.tencent.com/workbench/director/*
// @match        andon.oa.com/ticket/detail/*
// @match        andon.cloud.tencent.com/ticket/detail/*
// @match        cloudbase.oa.com/env-list*
// @match        bi.andata.oa.com/bi/Viewer
// @grant        none
// ==/UserScript==

(function() {
	Date.prototype.format = function(fmt) {
		var o = {
			"M+" : this.getMonth()+1,	//月份 
			"d+" : this.getDate(),	//日 
			"h+" : this.getHours(),	//小时 
			"m+" : this.getMinutes(),	//分 
			"s+" : this.getSeconds()	//秒 
		};
		if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		for (let k in o) {
			if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
		return fmt;
	}
	const config = {
		addStyle(text){//添加样式表到页面
			var style = document.createElement('style');
			style.type = 'text/css';
			style.innerHTML=text;
			document.getElementsByTagName('head').item(0).appendChild(style);
		},
		getQueryStr(name){//获取url中的参数
			var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
			var r = window.location.search.substr(1).match(reg);
			if(r!=null)return unescape(r[2]); return null;
		},
		async ajax(d) { //网络请求
			let cg = {headers: {'Content-Type': d['Content-Type']||'application/json'},method: d.type || 'GET'};
			if (d.cookie) cg.credentials = "include";
			if (d.type == 'POST') cg.body = d.body||JSON.stringify(d.data || {});
			return (await fetch(d.url, cg)).json();
		},
		copyEle:null,
		copyText(text){//拷贝文本
			if(!config.copyEle){
				let textEle = document.createElement('textarea');
				textEle.style = 'width: 1px;height: 1px;opacity: 0;';
				document.querySelector('body').appendChild(textEle);
				config.copyEle = textEle;
			}
			config.copyEle.value = text;
			config.copyEle.select();
			if (document.execCommand('copy')) {
				console.log('复制成功');
			}
		},
		async getUserInfo(){
			if(!config.userinfo){//userinfo不存在则去获取
				let {data} = await config.ajax({url:`/ticket/api/tickets/${config.getQueryStr('id')}/customer?use=owner`});
				config.userinfo = data;
			}
			return config.userinfo;
		},
		async createUl(option){//创建右侧工具栏
			if(!option) return;
			let body = document.getElementsByTagName('body')[0];
			let ul = document.createElement('ul');
			ul.setAttribute('class', 'tools-ul');
			option.forEach((e,i)=>{
				let li = document.createElement('li');
				if(e.html){//自定义
					li.innerHTML = e.html;
					li.className = e.className||"input-li";
				}else{//默认按钮
					li.textContent = e.name;
				}
				li.onclick = e.func?e.func:async function(){
					if(!e.url) return;
					let url = e.url;
					if(e.url && e.url.indexOf('{{uin}}')>-1){//链接有uin则去获取
						await config.getUserInfo();
					}
					if(e.url.indexOf('{{uin}}')>-1) url = url.replace('{{uin}}',config.userinfo.uin);
					window.open(url);
				}
				ul.appendChild(li);
			});
			body.appendChild(ul);
		},
		async allRun(){//开始运行
			for(let e of this.allPages){
				if(location.href.indexOf(e.path) > -1){
					config.addStyle(config.commonCss+e.css);//写入页面样式表
					this.createUl(e.ulOption);//创建右侧工具栏
					e.js();//执行对应的js脚本
					break;
				}
			}
		},
		commonCss:`
			::-webkit-scrollbar {width: 5px;height: 10px;}
			::-webkit-scrollbar-thumb {border-radius: 5px;-webkit-box-shadow: inset005pxrgba(0, 0, 0, 0.2);background: rgba(0, 0, 0, 0.2);}
			::-webkit-scrollbar-track {-webkit-box-shadow: inset005pxrgba(0, 0, 0, 0.2);border-radius: 0;background: rgba(0, 0, 0, 0.1);}
			ul.tools-ul {position: fixed;right: 0;top: 20px;margin: 20px;z-index: 999;list-style: none;padding: 0;font-size: 13px;}
			ul.tools-ul li {cursor: pointer;background: #fff;padding: 5px;border: 1px solid #9E9E9E;margin-bottom: 10px;transition: .3s;border-radius: 5px;line-height: 1rem;text-align: center;}
			ul.tools-ul li:not(.input-li):hover {color: #fff;background: #FF5722;border-color: #FF9800;}
			ul.tools-ul input {border: 0;padding: 5px;width: 130px;}
			ul.tools-ul input[type=date] {padding: 3px 5px;}
			ul.tools-ul li.input-li {padding: 0;}
		`,
		allPages:[{
			path:'/workbench/director',
			css:`
				.el-main {padding: 3px;}
				.page-panel {padding: 10px;}
				.page-breadcrumb, .page-panel .page-panel-main {margin-bottom: 3px;padding: 5px;}
				.menu-sign .el-button-group {margin-top: 0px;}
				body,html{overflow:hidden;}
				#pane-operator .page-panel.page-content {max-height: calc(100vh - 110px);overflow: auto;padding-top: 0;padding: 0;}
				.el-tabs__nav.is-top {position: fixed;top: 50px;left: 180px;}
				.el-breadcrumb {visibility: hidden;height: 28px;}
				.el-tabs__header.is-top {margin: 0;}
				.page-panel.page-content {padding: 0;}
				.el-table .cell {padding: 0 2px;}
				.copy.text-ellipsis {display: block;}
				.el-table--small th {padding: 0;}
			`,
			ulOption:[],
			async js(){
				window.setTimeout(()=>{
					document.querySelector('.filter.open button').click();
				},500);
			}
		},{
			path:'/ticket/detail',
			css:`
				.el-main {padding: 0;}
				a.quick-reply__setting {position: static!important;}
				.el-header {display: none;}
				.page-panel.page-content {padding-top: 5px;}
				.el-form--inline .el-form-item--small.el-form-item {margin-bottom: 0;}
				.watermark-wrapper .fixed-box {right: 30px;bottom: 20px;}
				.watermark-wrapper .fixed-box .box div {height: 40px;}
				.watermark-wrapper .fixed-box .box+.box {margin-top: 0;}
				.watermark-wrapper.fixed-box .box .el-icon-ali-copy-url {margin-bottom: 0;}
				
				.tips-div {position: fixed;height: 0px;top: -41px;width: 100%;text-align: center;padding: 5px;color: #fff;transition: .5s all;}
				.tips-div.show{top: 0;z-index:99;}
				.tips-div>p {background: #fff;margin: 0 auto;padding: 10px;width: max-content;border-radius: 10px;transition: .5s all;}
				.tips-div.show>p {background: #03a9f4;}
				.tips-div>span {background: #2196f3;padding: 5px;width: 20px;line-height: 20px;border: 1px solid #0d47a1;border-radius: 50%;margin-top: 5px;cursor: pointer;display: inline-block;color: #fff;font-weight: 800;opacity: 0.3;}
				.tips-div>span:hover {opacity: 1;}
				.tips-div>p>span+span {margin-left: 5px;padding-left: 5px;border-left: 1px solid #fff;}
			`,
			ulOption:[
				{name:'云函数》',url:`https://qcm.oa.com:8080/scf/query-function-new?rid=4&account={{uin}}&accountType=uin`},
				{name:'云环境》',url:`https://cloudbase.oa.com/env-list?uin={{uin}}`},
				{name:'COS 详情',url:`http://yy.cos.oa.com/host?user={{uin}}`},
				{name:'社区文档',url:`https://docs.cloudbase.net`},
				{name:'官方文档',url:`https://cloud.tencent.com/document/product/876`},
				{name:'微信文档',url:`https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html`},
				{name:'控制台》',url:`https://console.cloud.tencent.com/tcb/env/overview?envId=env-capibjba`},
				{name:'一键复制',url:`javascript:;`,async func(){
					let dateText = document.querySelectorAll('.ticket-info>.info:last-child .el-form-item__content>span')[5].innerText;
					let typeArr = document.querySelector('[prop="service_scene"]>span').innerText.split('>');
					let typeLen = typeArr.length;
					document.querySelector('.el-icon-ali-copy-url').click();
					let url = prompt("请粘贴域名","");
					url && config.copyText(`${dateText}\t${url}\t\t${typeArr[typeLen-2]}-${typeArr[typeLen-1]}\t\t\tTCB-${typeArr[typeLen-1]}\t`);
				}}
			],
			async js(){
				let user = await config.getUserInfo();
				let {data} = await config.ajax({url:'/ticket/api/tickets',cookie:true,type:'POST',data:{contact: user.uin, page: 1, limit: 100}});
				let showObj = {
					count:data.total,//总提单量
					solve:0,//结单量
					rateNum:0,//已评价数量
					noRate:0,//未评价数量
					rate4:0,//4星单数量
					rate5:0,//5星单数量
					badNum:0,//差评单量
					serveBad:0,//服务差评
				}
				for(let obj of data.data){
					if(obj.status == 3){//已结单
						showObj.solve ++;
						if(obj.service_rate>=1 && obj.service_rate<=5){//已评价
							showObj.rateNum ++;
							if(obj.service_rate>=1 && obj.service_rate<=4){//差评单
								showObj.badNum ++;
								if(obj.service_rate == 4){//4星差评
									showObj.rate4 ++;
								}
								if([1,2,3].includes(obj.unsatisfy_reason)){//服务差评
									showObj.serveBad ++;
								}
							}else if(obj.service_rate == 5){//五星好评
								showObj.rate5 ++;
							}
						}else{//未评价
							showObj.noRate ++;
						}
					}
				}
				let text = '';
				if(showObj.solve == 0){//新提单用户
					text += '<span>新提单用户，请注意引导好评。</span>';
				}else{//提过单用户
					text += `<span>结单${showObj.solve}个，评价${showObj.rateNum}个</span><span>反馈率${Math.ceil(showObj.rateNum/showObj.solve*100)}%</span>`;
					if(showObj.badNum == 0){//无差评优质客户
						text += `<span>无差评记录</span>`;
					}else{//有差评
						if(showObj.badNum-showObj.serveBad > 0){//有产品差评
							text += `<span>产品差评${showObj.badNum-showObj.serveBad}个</span>`;
						}
						if(showObj.serveBad > 0){//有服务差评
							text += `<span>服务差评${showObj.serveBad}个</span>`;
						}
						if(showObj.rate4 > 0){//有四星差评的客户
							text += `<span>其中${showObj.rate4}个四星</span>`;
						}
						text+= `<span>差评率${Math.ceil(showObj.badNum/showObj.rateNum*100)}%</span>`;
					}
				}
				
				let body = document.getElementsByTagName('body')[0];
				let div = document.createElement('div');
				div.setAttribute('class', 'tips-div show');
				div.innerHTML = `
<p>${text}</p>
<span id="tips-change-span">↑↓</span>
`;
				body.appendChild(div);
				document.querySelector('#tips-change-span').onclick = function(){
					if(div.className == 'tips-div'){
						div.className += ' show';
					}else{
						div.className = 'tips-div';
					}
				}
				console.log(showObj);
				window.setTimeout(()=>{
					document.querySelector('[value=Inner]').click();
					let leftBtn = document.querySelector('.switch-btn.el-icon-d-arrow-left');
					leftBtn&&leftBtn.click();
				},500);
				
			}
		},{
			path:'cloudbase.oa.com/env-list/detail',
			css:`
			`,
			ulOption:[],
			async js(){
				window.setTimeout(()=>{
					document.querySelector('#tab-scf').onclick = function(){
						let obj = {
							uin:config.getQueryStr('uin'),
							rid:{'ap-shanghai':'4','ap-guangzhou':'1'}[config.getQueryStr('region')],
							namespace:config.getQueryStr('env_id')
						}
						window.open(`https://qcm.oa.com:8080/scf/query-function-new?accountType=uin&account=${obj.uin}&namespace=${obj.namespace}&rid=${obj.rid}`);
					}
				},1000);
			}
		},{
			path:'cloudbase.oa.com/env-list',
			css:`
			`,
			ulOption:[
				{html:'<input type="text" placeholder="uin" id="uin">'},
				{html:'<input type="text" placeholder="envid" id="envid">'},
				{html:'<input type="text" placeholder="region" id="region" value="ap-shanghai" >'},
				{name:'复制权限', async func(){
					let uin = document.querySelector('#uin').value;
					let region = document.querySelector('#region').value;
					let reqObj = {
						"interfaceName": "DescribeEnvs",
						"params": {
							"action": "DescribeEnvs",
							"service": "tcb",
							"version": "2018-06-08",
							"uin": uin,
							"region": region,
							"apiParams": {
								"EnvId": document.querySelector('#envid').value
							}
						},
						"access": "INFO_QUERY_ACCESS"
					};
					let d = await config.ajax({url:'/api/idc?interfaceName=DescribeEnvs',data:reqObj,type:'POST'});
					if(d.code === 0 && d.result && d.result.EnvList && d.result.EnvList.length === 1){
						let env = d.result.EnvList[0];
						let bucket = env.Storages[0].Bucket;
						let bucketSplit = bucket.split('-');
						let appid = bucketSplit.pop();
						let staticCosStr = '';
						if (env.StaticStorages && env.StaticStorages.length > 0) {
							var staicBucket = env.StaticStorages[0].Bucket;
							staticCosStr = `,
			"qcs::cos:${region}:uid/${appid}:${staicBucket}/*"
`;
						}
						createCAMStr({
							envid:env.EnvId,
							uin:uin,
							namespace:env.Functions[0].Namespace,
							bucket:bucket,
							appid:appid,
							staticCosStr:staticCosStr,
							topic:env.LogServices[0].TopicId,
							logset:env.LogServices[0].LogsetId
						});
					}

					function createCAMStr(envData){
						let CAMPolicy = `{
	"version": "2.0",
	"statement": [{
		"effect": "allow",
		"resource": ["*"],
		"action": [
			"cam:GetRole",
			"tcb:CheckTcbService",
			"tcb:DescribePackages",
			"tcb:DescribeEnvLimit",
			"tcb:DescribeBillingInfo",
			"tcb:DescribeExtensionsInstalled",
			"tcb:DescribePostPackage",
			"tcb:CheckActiveQualified",
			"tcb:DescribeICPResources",
			"tcb:DescribeCloudBaseRunAdvancedConfiguration",
			"tcb:DescribeExtensions",
			"tcb:DescribeExtensionUpgrade",
			"tcb:DescribeCloudBaseProjectLatestVersionList",
			"tcb:DescribeCloudBaseRunServers"
		]
	}, {
		"effect": "allow",
		"resource": ["qcs::tcb:::env/${envData.envid}"],
		"action": ["tcb:*"]
	}, {
		"effect": "allow",
		"resource": [
			"qcs::scf:${region}::namespace/${envData.namespace}",
			"qcs::scf:${region}::namespace/${envData.namespace}/*"
		],
		"action": ["scf:*"]
	}, {
		"effect": "allow",
		"action": ["name/cos:*"],
		"resource": [
			"qcs::cos:${region}:uid/${envData.appid}:${envData.bucket}/*"${envData.staticCosStr}
		]
	}, {
		"effect": "allow",
		"action": ["cls:*"],
		"resource": [
			"qcs::cls::uin/${envData.uin}:topic/${envData.topic}",
			"qcs::cls::uin/${envData.uin}:logset/${envData.logset}"
		]
	}]
}`;
						console.log(CAMPolicy);
						config.copyText(CAMPolicy);
					}
				}
			}],
			async js(){
				
			}
		},{
			path:'bi.andata.oa.com/bi/Viewer',
			css:``,
			ulOption:[
				{html:'<input type="file" placeholder="上传数据分析报表" id="bb-file">'},
				{html:`<input type="text" placeholder="筛选条件" id="bb-param" value="user.spm=='颜吉军'" >`},
				{name:'分析打印',url:`javascript:;`,async func(){
					let bbFile = document.querySelector('#bb-file');
					let bbParam = document.querySelector('#bb-param').value;
					readWorkbookFromLocalFile(bbFile.files[0],async function(e){
						let a = XLSX.utils.sheet_to_json(e.Sheets[e.SheetNames[0]],{header:1});
						//console.log(a)
						//let {data} = await _this.$db.collection('cms-gyy-user').where({spm:'颜吉军'}).get();//,data:{param:{spm:'颜吉军'}}
						let pbData = await config.ajax({url:`https://a.yanjj.top/getPbData`,type:'POST',data:{all:true}});
						let users = {},str = '';
						for (let u in pbData.user) {
							let user = pbData.user[u];
							if(eval(bbParam)) users[user.pName] = user;
						}
						//console.log(users)
						for(let v of a[0]){//表头信息
							str+=`${v}\t`;
						}
						str += '\n';
						for(let y of a){
							if(users[y[0]]){//存在的用户才进行处理
								for(let i=0,len=y.length;i<len;i++){
									str+=(i==0?`${users[y[i]].name}\t`:`${y[i]||' '}\t`);
								}
								str+='\n';
							}
						}
						//config.copyText(str);
						console.log(str);
					})
					function readWorkbookFromLocalFile(file, callback) {
						var reader = new FileReader();
						reader.onload = function(e) {
							var data = e.target.result;
							var workbook = XLSX.read(data, {type: 'binary'});
							if(callback) callback(workbook);
						};
						reader.readAsBinaryString(file);
					}
				}}
			],
			async js(){
				let script = document.createElement('script');
				script.setAttribute('type','text/javascript');
				script.setAttribute('src','https://env-capibjba-1302428365.tcloudbaseapp.com/common/xlsx/xlsx.full.min.js');
				document.getElementsByTagName('head')[0].appendChild(script);
			}
		}]
	}
	config.allRun();
})();
