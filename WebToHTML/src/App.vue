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
      <el-tabs v-model="activeTab">
        <el-tab-pane v-for="(tab, index) in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <MonacoEditor
            :key="index"
            :language="tab.language"
            :codeValue="tab.codeValue"
            @updataCode="updateMethod($event)"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted,computed } from 'vue';
import MonacoEditor from '@/components/MonacoEditor.vue';
import draggable from 'vuedraggable';
import jsBeautify from 'js-beautify';

const pretty = (json) => {
  return jsBeautify.js_beautify(JSON.stringify(json), { indent_size: 2 });
};

// 模块数据
const modules = ref([
  { id: 1, name: 'Banner', json: { 
    type: 'banner', 
    html: "<div class='banner'><img src='https://ts1.cn.mm.bing.net/th/id/R-C.f688e3cb280f908d5644557baae0ec5d?rik=1mLfzYhX4x7SuQ&riu=http%3a%2f%2fhzyly.com%2fupload%2f201908%2f26%2f201908261930501050.jpg&ehk=1xjEHsYoxq5Zuyr0US9qR%2bDj0cqyOdRDX8E10DFx4%2bU%3d&risl=&pid=ImgRaw&r=0'><h1>这是风景图片</h1></div>", 
    css: ".banner { text-align: center; } .banner img { width: 600px; }", 
    js: "document.querySelector('.banner').addEventListener('click', function() { alert('Banner clicked!'); });", 
  }},
  { id: 2, name: 'Header', json: { 
    type: 'header', 
    html: "<header class='header'><h1>我是标题</h1></header>", 
    css: ".header { font-size: 24px; color: blue; }", 
    js: "", 
  }},
  { id: 3, name: 'Footer', json: { 
    type: 'footer', 
    html: "<footer class='footer'><p>我是页脚</p></footer>", 
    css: ".footer { text-align: center; color: #aaa; }", 
    js: "", 
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
      name: 'js',
      language: 'js',
      codeValue: jsCode
    },
  ])

const cloneModule = (module) => ({ ...module });

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
  })
  const combinedHTML = canvasModules.value.map(node => generateHTML(node.json.html,node.idx)).join('');

  const combinedCSS = canvasModules.value.map(node => node.json.css).join('\n');
  const combinedJS = canvasModules.value.map(node => node.json.js).join('\n');

  // 查找是否已经存在带有特定 ID 的 <style> 元素
  let styleElement = document.getElementById('custom-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'custom-styles';
    document.head.appendChild(styleElement);
  }

  // 生成新的 CSS
  const existingCSS = styleElement.textContent || '';
  const newCSS = combinedCSS;
  
  // 判断是否需要更新样式
  if (existingCSS !== newCSS) {
    styleElement.textContent = newCSS;
  }

  // 更新代码面板
  htmlCode.value = combinedHTML;
  cssCode.value = combinedCSS;
  jsCode.value = combinedJS;

};



// 监听 canvasModules 变化并更新右侧代码面板
watch(canvasModules, updatePreview, { deep: true });

onMounted(() => {
  updatePreview();
});

// 更新修改后的代码
function updateMethod(data){
  let { type } = data
  if(type === 'html'){
    console.log(canvasModules.value)
    console.log(data.parsedArray)
   

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

  }

  if(type === 'css'){

  }

  if(type === 'js'){

  }
}

// function updateHtmlCode(newCode){
//   monacoEditorHtml.value = newCode
//   console.log(canvasModules.value)
  
//   // htmlCode.value = newCode;
//   // modules.value[0]
//   // canvasModules.value[1].json.html = 'aaaasdadasda'
//   // console.log( canvasModules.value)
// };

// function updateCssCode(newCode){
//   // console.log(newCode)
//   // cssCode.value = newCode;
// };

// function updateJsCode(newCode){
//   // jsCode.value = newCode;
// };


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
