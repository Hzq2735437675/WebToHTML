import { defineStore } from 'pinia'

// 生成唯一ID的函数
const generateUniqueId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 预设模块数据
const defaultModules = [
  {
    name: 'Header 1',
    className: 'Header',
    html: `<header class="header">
  <h1>Welcome to My Website</h1>
  <nav>
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </nav>
</header>`,
    css: `.header {
  background: #4a90e2;
  color: white;
  padding: 1rem;
  text-align: center;
}
.header nav {
  margin-top: 1rem;
}
.header a {
  color: white;
  text-decoration: none;
  margin: 0 1rem;
}
.header a:hover {
  text-decoration: underline;
}`,
    js: `console.log('Header module loaded');`
  },
  {
    name: 'Content Section',
    className: 'Content',
    html: `<section class="content">
  <h2>Main Content</h2>
  <p>This is a sample content section with some interactive features.</p>
  <button id="clickMe">Click Me!</button>
</section>`,
    css: `.content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}
.content button {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
}
.content button:hover {
  background: #357abd;
}`,
    js: `document.getElementById('clickMe').addEventListener('click', () => {
  alert('Button clicked!');
});`
    },
    {
       name: 'Banner 组件',
        className: 'Banner',
        html: "<div class='banner'><img id='bannerImg' src=''><h1>这是风景图片</h1></div>",
     css: ".banner { text-align: center; } .banner img { width: 600px; }",
      js: `
      const bannerList = [
      'https://ts1.cn.mm.bing.net/th/id/R-C.11a2495a8d154cf40998974a49e1e6df?rik=xKzl5aYXBVDq%2fA&riu=http%3a%2f%2fseopic.699pic.com%2fphoto%2f50073%2f0972.jpg_wh1200.jpg&ehk=g9IpqEmyB%2frg%2bdm0GXVmLTRsGDi8UqqH%2fzb85ivuP9Q%3d&risl=&pid=ImgRaw&r=0',
      'https://ts1.cn.mm.bing.net/th/id/R-C.f688e3cb280f908d5644557baae0ec5d?rik=1mLfzYhX4x7SuQ&riu=http%3a%2f%2fhzyly.com%2fupload%2f201908%2f26%2f201908261930501050.jpg&ehk=1xjEHsYoxq5Zuyr0US9qR%2bDj0cqyOdRDX8E10DFx4%2bU%3d&risl=&pid=ImgRaw&r=0'
      ]
      function showImage(index) {
        const banner = document.querySelector('#bannerImg');
        banner.src = bannerList[index];
      }
      setInterval(() => {
        const banner = document.querySelector('#bannerImg');
        let currentIndex = bannerList.indexOf(banner.src);
        let nextIndex = (currentIndex + 1) % bannerList.length;
        showImage(nextIndex);
      }, 1000);

      showImage(0);
    `,
  }
]

export const useModulesStore = defineStore('modules', {
  state: () => ({
    availableModules: defaultModules,
    previewModules: [], // 预览区域的模块
    currentEditingModule: null, // 当前正在编辑的模块
    isPreviewMode: false
  }),

  getters: {
    // 获取当前编辑模块的代码
    currentCode() {
      if (!this.currentEditingModule) return { html: '', css: '', js: '' }
      return {
        html: this.currentEditingModule.html || '',
        css: this.currentEditingModule.css || '',
        js: this.currentEditingModule.js || ''
      }
    }
  },
  
  actions: {
    // 添加模块到预览区
    addToPreview(moduleData) {
      // 创建模块的深拷贝，并添加唯一ID
      const newModule = {
        ...JSON.parse(JSON.stringify(moduleData)),
        id: generateUniqueId(moduleData.className.toLowerCase())
      }
      this.previewModules.push(newModule)
      // 自动选中新添加的模块进行编辑
      this.setEditingModule(newModule.id)
    },
    
    // 设置当前正在编辑的模块
    setEditingModule(moduleId) {
      this.currentEditingModule = this.previewModules.find(m => m.id === moduleId)
    },
    
    // 更新模块代码
    updateModuleCode(field, value) {
      if (!this.currentEditingModule) return
      this.currentEditingModule[field] = value.trim()
    },
    
    // 切换预览模式
    togglePreviewMode() {
      this.isPreviewMode = !this.isPreviewMode
    },
    
    // 重新排序模块
    reorderModules(newOrder) {
      this.previewModules = newOrder
    },

    // 清除当前编辑模块
    clearEditingModule() {
      this.currentEditingModule = null
    }
  }
})