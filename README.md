# what
这是一个在cloudflare worker上创建的小网站，主要是你可以通过浏览器插件把你想要书签的网站发送到worker网站上并展示，或者编辑、更新等。  
This is a small website created on Cloudflare Worker. Its main function is to allow you to use a browser plugin to send websites that you want to bookmark to the worker website for display, or to edit and update them.  

# how

1、创建worker站点，部署成功后，点击“编辑代码”，把workers.js里的文件都复制过去，然后重新点击“部署”;  
2、在workers KV选项中创建kv命名空间，‘MY_LINKS_DB’;  
3、回到新建的worker站点，中间区域有个“绑定”——“添加绑定”——选择“KV命名空间”——变量名称为“LINKS_DB” ,KV命名空间选择上一步创建的命名空间“MY_LINKS_DB”;  
4、创建环境变量 "AUTH_SECRET"；  
5、把link-saver-extension文件夹下载到本地，然后在浏览器扩展中选择“开发者模式”，“加载解压缩的扩展”，把扩展进行安装。  
6、右键扩展，选择“扩展选项”，填写worker地址，需要注意的是请按“https://my-links-worker.samafed.workers.dev/api/links”这种格式填写，‘AUTH_SECRET’填写第4步创建的值，最下面的“Set or Change Master Password”是一个本地密码，可填可不填，填上的话每次发送需要输入这个密码。  
7、打开一个网站，点击这个扩展，输入tag，点击‘Save Link’进行测试。     


1. Create a worker site. After successful deployment, click "Edit Code," copy all files from workers.js, and then click "Deploy" again.

2. In the worker KV options, create a key-value namespace named 'MY_LINKS_DB'.

3. Return to the newly created worker site. In the middle area, there's a "Bindings" section—"Add Binding"—select "KV Namespace"—name the variable "LINKS_DB," and select the namespace "MY_LINKS_DB" created in the previous step.

4. Create the environment variable "AUTH_SECRET".

5. Download the link-saver-extension folder to your local machine, then in your browser extensions, select "Developer mode," and "Load unzipped extension" to install the extension. 6. Right-click the extension, select "Extension Options," and enter the worker address. Note that you should enter it in the format "https://my-links-worker.samafed.workers.dev/api/links." Enter the value you created in step 4 for 'AUTH_SECRET'. The "Set or Change Master Password" at the bottom is a local password; it's optional, but you'll need to enter it every time you send a link.

7. Open a website, click on this extension, enter a tag, and click 'Save Link' to test it.
