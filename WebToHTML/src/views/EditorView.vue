<template>
  <div class="editor-page">
    <!-- 顶部预览控制区 -->
    <div class="preview-header">
      <h3>预览区域</h3>
      <div class="preview-actions">
        <el-switch
          v-model="modulesStore.isPreviewMode"
          active-text="预览模式"
          inactive-text="编辑模式"
        />
        <el-button type="primary" @click="previewHTML"> 预览页面 </el-button>
        <el-button type="primary" @click="exportHTML"> 保存页面 </el-button>
      </div>
    </div>

    <!-- 主编辑区域 -->
    <div class="editor-container">
      <!-- 左侧模块列表 -->
      <div class="modules-panel">
        <draggable
          :list="modulesStore.availableModules"
          :group="{ name: 'modules', pull: 'clone', put: false }"
          item-key="className"
          :clone="cloneModule"
          :sort="false"
          class="modules-list"
        >
          <template #item="{ element }">
            <div class="module-item">
              <el-card>
                <h4>{{ element.name }}</h4>
              </el-card>
            </div>
          </template>
        </draggable>
      </div>

      <!-- 中间预览区域 -->
      <div class="preview-panel">
        <draggable
          v-model="modulesStore.previewModules"
          group="modules"
          item-key="id"
          class="preview-area"
          :disabled="modulesStore.isPreviewMode"
          @start="drag = true"
          @end="drag = false"
          @add="handleModuleAdd"
        >
          <template #item="{ element }">
            <div
              class="preview-module"
              :class="{ active: isModuleEditing(element.id) }"
              @click="selectModule(element.id)"
            >
              <div class="module-content" v-html="element.html"></div>
              <component :is="'style'">{{ element.css }}</component>
              <component :is="'script'">{{ element.js }}</component>
            </div>
          </template>
        </draggable>
      </div>

      <!-- 右侧代码编辑器 -->
      <div class="code-panel">
        <el-tabs v-model="activeTab" class="code-tabs">
          <el-tab-pane label="HTML" name="html">
            <div ref="htmlEditor" class="monaco-container"></div>
          </el-tab-pane>
          <el-tab-pane label="CSS" name="css">
            <div ref="cssEditor" class="monaco-container"></div>
          </el-tab-pane>
          <el-tab-pane label="JavaScript" name="js">
            <div ref="jsEditor" class="monaco-container"></div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { useModulesStore } from "../stores/modules";
import draggable from "vuedraggable";
import * as monaco from "monaco-editor";
import { saveAs } from "file-saver";

const modulesStore = useModulesStore();
const activeTab = ref("html");
const drag = ref(false);

// 编辑器引用
const htmlEditor = ref(null);
const cssEditor = ref(null);
const jsEditor = ref(null);
let editors = {
  html: null,
  css: null,
  js: null,
};

// 计算是否有模块
const hasModules = computed(() => modulesStore.previewModules.length > 0);

// 检查模块是否正在编辑
const isModuleEditing = (moduleId) => {
  return modulesStore.currentEditingModule?.id === moduleId;
};

// 防止编辑器内容更新时触发change事件
let isUpdatingEditor = false;

// 记录当前正在编辑的模块ID
let currentEditingId = null;

// 监听当前编辑模块变化
watch(
  () => modulesStore.currentEditingModule,
  (newModule) => {
    if (!newModule) return;

    // 如果切换了不同的模块，更新编辑器内容
    if (currentEditingId !== newModule.id) {
      currentEditingId = newModule.id;
      nextTick(() => {
        isUpdatingEditor = true;
        try {
          // 更新各个编辑器的内容
          if (editors.html) {
            editors.html.setValue(newModule.html || "");
          }
          if (editors.css) {
            editors.css.setValue(newModule.css || "");
          }
          if (editors.js) {
            editors.js.setValue(newModule.js || "");
          }
        } finally {
          isUpdatingEditor = false;
        }
      });
    }
  },
  { deep: true }
);

// 监听标签页切换
watch(activeTab, (newTab) => {
  nextTick(() => {
    if (editors[newTab]) {
      editors[newTab].layout();
    }
  });
});

onMounted(async () => {
  await nextTick();

  // 初始化编辑器
  if (htmlEditor.value) {
    editors.html = createEditor(htmlEditor.value, "html");
  }
  if (cssEditor.value) {
    editors.css = createEditor(cssEditor.value, "css");
  }
  if (jsEditor.value) {
    editors.js = createEditor(jsEditor.value, "javascript");
  }
});

onBeforeUnmount(() => {
  Object.values(editors).forEach((editor) => {
    if (editor) {
      editor.dispose();
    }
  });
});

function createEditor(container, language) {
  const editor = monaco.editor.create(container, {
    value: "",
    language,
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: "on",
    roundedSelection: false,
    wordWrap: "on",
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true,
  });

  // 添加内容变更监听
  let changeTimeout = null;
  editor.onDidChangeModelContent(() => {
    if (isUpdatingEditor) return;

    // 使用防抖来避免频繁更新
    clearTimeout(changeTimeout);
    changeTimeout = setTimeout(() => {
      const value = editor.getValue();
      const type = language === "javascript" ? "js" : language;

      // 确保更新到当前正在编辑的模块
      if (
        currentEditingId &&
        modulesStore.currentEditingModule?.id === currentEditingId
      ) {
        modulesStore.updateModuleCode(type, value);
      }
    }, 100);
  });

  return editor;
}

const cloneModule = (item) => {
  // 只返回克隆的模块，不在这里添加到预览区
  return JSON.parse(JSON.stringify(item));
};

const handleModuleAdd = (event) => {
  // 获取新添加的模块数据
  const newModuleData = modulesStore.previewModules[event.newIndex];
  // 移除自动添加的模块（因为它没有正确的ID）
  modulesStore.previewModules.splice(event.newIndex, 1);
  // 通过store添加模块，这样会生成正确的ID
  modulesStore.addToPreview(newModuleData);
};

const selectModule = (moduleId) => {
  // 如果点击的是同一个模块，不做任何操作
  if (currentEditingId === moduleId) return;

  // 更新当前编辑的模块
  modulesStore.setEditingModule(moduleId);
};
// 保存页面
const exportHTML = () => {
  const modules = modulesStore.previewModules;
  const css = modules.map((m) => m.css).join("\n\n");
  const js = modules.map((m) => m.js).join("\n\n");
  const html = modules.map((m) => m.html).join("\n\n");

  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Page</title>
    <style>
      ${css}
    </style>
</head>
<body>
    ${html}
</body>
<script>
    ${js}
<\/script>
</html>`;

  const blob = new Blob([template], { type: "text/html;charset=utf-8" });
  saveAs(blob, "exported-page.html");
};

// 预览页面
const previewHTML = () => {
  const modules = modulesStore.previewModules;
  const css = modules.map((m) => m.css).join("\n\n");
  const js = modules.map((m) => m.js).join("\n\n");
  const html = modules.map((m) => m.html).join("\n\n");

  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Page</title>
    <style>
      ${css}
    </style>
</head>
<body>
    ${html}
    
</body>
<script>
    ${js}
<\/script>
</html>`;

  // 创建一个新的 Blob URL
  const blob = new Blob([template], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);

  // 在新窗口中打开
  window.open(blobUrl, "_blank");

  // 延迟释放 Blob URL
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 100);
};
</script>

<style lang="scss" scoped>
.editor-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);

  .preview-header {
    height: 60px;
    padding: 0 20px;
    background: var(--el-bg-color-overlay);
    border-bottom: 1px solid var(--el-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .preview-actions {
      display: flex;
      gap: 12px;
    }
  }

  .editor-container {
    flex: 1;
    display: flex;
    padding: 20px;
    gap: 20px;
    min-width: 1600px;
    height: calc(100vh - 60px);

    .modules-panel {
      width: 280px;
      flex-shrink: 0;
      background: var(--el-bg-color-overlay);
      border-radius: 8px;

      .modules-list {
        height: 100%;
        overflow-y: auto;
        .module-item {
          margin-bottom: 12px;
          cursor: move;

          .el-card {
            transition: transform 0.2s;

            &:hover {
              transform: translateY(-2px);
            }
          }
        }
      }
    }

    .preview-panel {
      flex: 1;
      background: var(--el-bg-color-overlay);
      border-radius: 8px;
      display: flex;
      flex-direction: column;

      .preview-area {
        flex: 1;
        overflow-y: auto;
        background: white;
        border-radius: 4px;

        .preview-module {
          margin-bottom: 16px;
          border: 2px solid transparent;
          transition: border-color 0.2s;

          &.active {
            border-color: var(--el-color-primary);
          }

          &:hover {
            border-color: var(--el-color-primary-light-3);
          }
        }
      }
    }

    .code-panel {
      width: 500px;
      flex-shrink: 0;
      background: var(--el-bg-color-overlay);
      border-radius: 8px;
      display: flex;
      flex-direction: column;

      .code-tabs {
        height: 100%;
        display: flex;

        :deep(.el-tabs__content) {
          flex: 1;
          padding: 0;

          .el-tab-pane {
            height: 100%;
          }
        }

        .monaco-container {
          height: 100%;
          min-height: 300px;
        }
      }
    }
  }
}
</style>
