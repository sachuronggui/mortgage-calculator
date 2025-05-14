# GitHub部署指南

这是一个将"智能房贷计算与规划器"应用部署到GitHub Pages的步骤指南。

## 步骤1：创建GitHub仓库

1. 登录您的GitHub账户
2. 点击右上角的"+"图标，然后选择"New repository"
3. 设置仓库名称为"mortgage-calculator"（或您希望的其他名称）
4. 提供描述："智能房贷计算与规划器 - 一个帮助用户计算房贷月供和分析提前还款方案的网页应用"
5. 选择"Public"（公开）
6. 不要勾选"Initialize this repository with a README"
7. 点击"Create repository"

## 步骤2：推送本地仓库到GitHub

创建仓库后，GitHub会提供命令行说明。按照以下步骤操作：

```bash
# 已经初始化了本地仓库并提交了更改，所以只需添加远程仓库
git remote add origin https://github.com/你的用户名/mortgage-calculator.git

# 推送代码到GitHub
git push -u origin main
```

请将上面的URL替换为GitHub提供的实际仓库URL。

## 步骤3：启用GitHub Pages

1. 在GitHub仓库页面，点击"Settings"
2. 在左侧菜单栏中向下滚动，找到"Pages"选项
3. 在"Source"部分，选择"Deploy from a branch"
4. 选择"main"分支和"/(root)"文件夹
5. 点击"Save"
6. 等待几分钟，GitHub Pages将会构建您的网站
7. 一旦构建完成，您会在页面顶部看到一个成功消息，包含您网站的URL（通常是`https://你的用户名.github.io/mortgage-calculator/`）

## 步骤4：访问您的网站

在GitHub Pages构建完成后（通常需要几分钟），您可以通过分配的URL访问您的应用：
`https://你的用户名.github.io/mortgage-calculator/`

## 可选：配置自定义域名

如果您拥有自己的域名并希望使用它来访问您的应用：

1. 在GitHub仓库的"Settings" > "Pages"部分，找到"Custom domain"
2. 输入您的域名（例如`calculator.yourdomain.com`）
3. 点击"Save"
4. 在您的域名注册商处，添加正确的DNS记录：
   - 对于子域名：添加一个CNAME记录，指向`你的用户名.github.io`
   - 对于主域名：添加四个A记录，指向GitHub Pages的IP地址：
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
5. 等待DNS传播（可能需要24小时）
6. 勾选"Enforce HTTPS"选项以启用安全连接

## 更新网站

每当您对本地仓库进行更改并推送到GitHub时，GitHub Pages将自动重新构建您的网站：

```bash
# 在进行更改后
git add .
git commit -m "更新：描述您的更改"
git push
``` 