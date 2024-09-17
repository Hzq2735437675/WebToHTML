<template>
  <div class="app-container">
    <!-- 模块展示面板 -->
    <div class="modules-panel">
      <el-switch v-model="isPageDrag" active-text="开启拖拽" inactive-text="关闭拖拽" />
      <draggable
        v-model="modules"
        :group="{ name: 'modules', pull: 'clone', put: false }"
        :clone="cloneModule"
        item-key="id"
      >
        <template #item="{ element }">
          <div class="module-item">{{ element.name }}</div>
        </template>
      </draggable>
    </div>

    <!-- 页面效果区域 -->
    <div class="canvas-panel">
      <draggable
        v-model="canvasModules"
        :group="{ name: 'modules', pull: false, put: true }"
        item-key="id"
        class="draggableHtml canvas-panel-box"
        @end="updatePreview"
        v-show="isPageDrag"
      >
        <template #item="{ element }">
          <div v-html="generateHTML(element.json.html,element.idx)"></div>
        </template>
      </draggable>

      <!-- html效果查看页面 -->
      <div class="canvas-panel-box" v-html='monacoEditorHtml' v-show="!isPageDrag"></div>
    </div>

    <!-- 代码展示区域 -->
    <div class="code-panel">
      <el-tabs v-model="activeTab" @tab-change='changeActiveType'>
        <el-tab-pane v-for="(tab, index) in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <MonacoEditor
            :key="index"
            :language="tab.language"
            :codeValue="tab.codeValue"
            ref="MonacoEditorRef"
            @updataCode="updateMethod($event)"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script type="text/javascript">
  // 在 script setup 外部定义这个全局对象
window.customScriptManager = {
  currentId: null,
  timers: [],
  cleanup: () => {},
  isInitialized: false
};

</script>

<script setup>

import { ref, watch, onMounted,computed } from 'vue';
import MonacoEditor from '@/components/MonacoEditor.vue';
import draggable from 'vuedraggable';
import { useEditorStore } from '@/store/definePiniaStore.js';
const editorStore = useEditorStore();



// 模块数据
const modules = ref([
  {  name: 'Banner', json: { 
    type: 'banner', 
    html: "<div class='banner'><img id='bannerImg' src=''><h1>这是风景图片</h1></div>", 
    css: ".banner { text-align: center; } .banner img { width: 600px; }", 
     js: `
      const bannerList = [
      'https://ts1.cn.mm.bing.net/th/id/R-C.11a2495a8d154cf40998974a49e1e6df?rik=xKzl5aYXBVDq%2fA&riu=http%3a%2f%2fseopic.699pic.com%2fphoto%2f50073%2f0972.jpg_wh1200.jpg&ehk=g9IpqEmyB%2frg%2bdm0GXVmLTRsGDi8UqqH%2fzb85ivuP9Q%3d&risl=&pid=ImgRaw&r=0',
      'https://ts1.cn.mm.bing.net/th/id/R-C.f688e3cb280f908d5644557baae0ec5d?rik=1mLfzYhX4x7SuQ&riu=http%3a%2f%2fhzyly.com%2fupload%2f201908%2f26%2f201908261930501050.jpg&ehk=1xjEHsYoxq5Zuyr0US9qR%2bDj0cqyOdRDX8E10DFx4%2bU%3d&risl=&pid=ImgRaw&r=0'
      ]function showImage(index) {
        const banner = document.querySelector('#bannerImg');
        banner.src = bannerList[index];
      }// 定时器实现自动轮播
      setInterval(() => {
        const banner = document.querySelector('#bannerImg');
        let currentIndex = bannerList.indexOf(banner.src);
        let nextIndex = (currentIndex + 1) % bannerList.length;
        showImage(nextIndex);
      }, 1000);

                    // 初始化显示第一张图片
      showImage(0);
    `, 
  }},
  {  name: 'Header', json: { 
    type: 'header', 
    html: "<header class='header'><h1>我是标题</h1></header>", 
    css: ".header { font-size: 24px; color: blue; }", 
    js: "console.log(7777777)", 
  }},
  {  name: 'Footer', json: { 
    type: 'footer', 
    html: "<footer class='footer'><p>我是页脚</p></footer>", 
    css: ".footer { text-align: center; color: #aaa; }", 
    js: "console.log(323424)", 
  }}
]);

const canvasModules = ref([]);
const htmlCode = ref('');
const cssCode = ref('');
const jsCode = ref('');
const activeTab = ref('html');
const isPageDrag  = ref(true)
const monacoEditorHtml = ref('')  //code编辑器返回的html

const tabs = ref([
    {
      label: 'HTML',
      name: 'html',
      language: 'html',
      codeValue: htmlCode
    },
    {
      label: 'CSS',
      name: 'css',
      language: 'css',
      codeValue: cssCode
    },
    {
      label: 'JavaScript',
      name: 'javascript',
      language: 'javascript',
      codeValue: jsCode
    },
  ])
const MonacoEditorRef = ref(null)

// 监听 canvasModules 变化并更新右侧代码面板
watch(canvasModules, (n,o) => {
  if (!editorStore.isUpdatingFromEditor) {
    updatePreview();
  }
  editorStore.setIsUpdatingFromEditor(false);
}, { deep: true });


const cloneModule = (module) => JSON.parse(JSON.stringify(module));

const generateHTML = (html,idx) => {
  let newHtml =   `
    <div idx='${idx}'>
      ${html}
    </div>
  `
  return newHtml
};


const updatePreview = () => {
  canvasModules.value.forEach((item,index)=>{
    item.idx = index.toString()
    item.id = index + 1
  })
  const combinedHTML = canvasModules.value.map(node => generateHTML(node.json.html,node.idx)).join('');

  // 使用 Set 存储唯一的 CSS 和 JS
  const uniqueCSS = new Set();
  const uniqueJS = new Set();

  // 遍历 canvasModules，添加唯一的 CSS 和 JS
  canvasModules.value.forEach(node => {
    if (node.json.css) {
      uniqueCSS.add(node.json.css);
    }
    if (node.json.js) {
      uniqueJS.add(node.json.js);
    }
  });

  // 将 Set 转换为字符串，确保每个样式和脚本只添加一次
  const combinedCSS = Array.from(uniqueCSS).join('\n');
  const combinedJS = Array.from(uniqueJS).join('\n');

  // 查找是否已经存在带有特定 ID 的 <style> 元素
  let styleElement = document.getElementById('custom-styles');
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'custom-styles';
    document.head.appendChild(styleElement);
  }

  // 提取 CSS 类名和 ID
  const extractSelectors = (css) => {
    const classSelectors = css.match(/\.[a-zA-Z0-9_-]+(?=\s*\{)/g) || [];
    const idSelectors = css.match(/#[a-zA-Z0-9_-]+(?=\s*\{)/g) || [];
    return new Set([...classSelectors, ...idSelectors]);
  };

  const existingSelectors = extractSelectors(cssCode.value);
  const newSelectors = extractSelectors(combinedCSS);

  // 判断是否需要更新样式
  const uniqueNewCSS = combinedCSS.split('\n').filter(line => {
    const selectorMatch = line.match(/^[.#][a-zA-Z0-9_-]+/);
    return selectorMatch && !existingSelectors.has(selectorMatch[0]);
  }).join('\n');

  

  htmlCode.value = combinedHTML;
  
  if (uniqueNewCSS) {
    styleElement.textContent += uniqueNewCSS;
    cssCode.value += uniqueNewCSS;
  }

  if (combinedJS) {
    jsCode.value = combinedJS;
  }
};



// 更新修改后的代码
function updateMethod(data){
  let { type } = data
  if(type === 'html'){
    if(data.parsedArray.length &&canvasModules.value.length){
      for(let item of data.parsedArray){
        let isModule = canvasModules.value.find(moduleItem=> moduleItem.idx === item.idx)
        if(isModule && isModule.json.html !== item.htmlCode){
          isModule.json.html = item.htmlCode
        }
      }
    }
   const combinedHTML = canvasModules.value.map(node => generateHTML(node.json.html,node.idx)).join('');
    monacoEditorHtml.value = combinedHTML
    return
  }

  if(type === 'css'){
    let styleElement = document.getElementById('custom-styles');
    styleElement.textContent = data.cssCodeVal
    return
  }

  if(type === 'javascript'){
    // 生成唯一ID
    const scriptId = 'custom-script-' + Date.now();

    // 清理旧的脚本
    if (window.customScriptManager.currentId) {
      const oldScript = document.getElementById(window.customScriptManager.currentId);
      if (oldScript) {
        oldScript.remove();
      }
      window.customScriptManager.cleanup();
    }

    // 创建新的 script 元素
    const scriptElement = document.createElement('script');
    scriptElement.id = scriptId;

    const wrappedJS = `
      (function() {
        const scriptId = '${scriptId}';
        let intervals = [];

        // 清理函数
        window.customScriptManager.cleanup = function() {
          intervals.forEach(interval => clearInterval(interval));
          intervals = [];
        };

        // 包装 setInterval 函数
        function safeSetInterval(callback, delay) {
          const intervalId = setInterval(() => {
            if (scriptId === window.customScriptManager.currentId) {
              callback();
            } else {
              clearInterval(intervalId);
            }
          }, delay);
          intervals.push(intervalId);
          return intervalId;
        }

        // 主要的代码逻辑
        ${data.jsCodeVal.replace(/setInterval/g, 'safeSetInterval')}

        // 更新当前活动的脚本ID
        window.customScriptManager.currentId = scriptId;
      })();
    `;
    scriptElement.textContent = wrappedJS;
    document.body.appendChild(scriptElement);
    return
  }
}

function changeActiveType(e){
  // if(e === 'javascript'){
  //  MonacoEditorRef.value[2].updateEditorOptions()
  // }
}

onMounted(() => {
  updatePreview();
});

</script>

<style lang="scss" scoped>

.app-container {
  display: flex;
  width: 100vw;
  justify-content: space-between;
}
.modules-panel {
  padding: 10px 60px;
  margin: 0 10px;
  border-right: 1px solid #ddd;
}
.canvas-panel {
  width: 1200px;
  position: relative;
  height: 100vh;
  overflow: auto;
  &-box{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

}
.code-panel {
  flex: 1 0;
  padding-left: 15px;
  border-left: 1px solid #ddd;
}
.module-item {
  padding: 10px;
  margin: 5px 0;
  background-color: #f9f9f9;
  cursor: pointer;
}

</style>
