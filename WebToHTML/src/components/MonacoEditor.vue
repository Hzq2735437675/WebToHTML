<template>
  <div :style="{ width: customWidth, height: customHeight }" class="monaco-editor-container">
    <div class="monacoEditor" ref="editorRef"></div>
  </div>
</template>

<script setup>
import { ref,toRefs,nextTick,onMounted, onBeforeUnmount, watch, defineProps, defineEmits,defineExpose } from 'vue';
import { ElMessage } from 'element-plus'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import * as monaco from 'monaco-editor'
import { html as htmlBeautify, css as cssBeautify, js as jsBeautify } from 'js-beautify';

import { useEditorStore } from '@/store/definePiniaStore.js';
const editorStore = useEditorStore();

const editorRef = ref(null);
const editorInstance = ref(null);

const props = defineProps({
  language: {
    type: String,
    default: 'javascript'
  },
  codeValue: {
    type: String,
    default: ''
  },
  customWidth: {
    type: String,
    default: '100%'
  },
  customHeight: {
    type: String,
    default: 'calc(100vh - 55px)'
  }
});

const emits = defineEmits(['updataCode'])

const {language,codeValue,customWidth,customHeight} = toRefs(props)

 // @ts-ignore
  self.MonacoEnvironment = {
    getWorker(_,label) {
      if (label === 'json') {
        return new jsonWorker()
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new cssWorker()
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new htmlWorker()
      }
      if (['typescript', 'javascript'].includes(label)) {
        return new tsWorker()
      }
      return new EditorWorker()
    }
  }

let editor = null

const parseHtmlWithIdx = (htmlContent) => {
	const parser = new DOMParser();
	  const doc = parser.parseFromString(htmlContent, 'text/html');
	  const divs = doc.querySelectorAll('div[idx]');
	  
	  const parsedArray = Array.from(divs).map(div => {
	    // 获取 idx 属性值
	    const idx = div.getAttribute('idx');
	    
	    // 获取 div 内部的 HTML，并去除空格和换行符
	    const htmlCode = div.innerHTML.replace(/\n\s*/g, '').trim();
	    
	    return {
	      idx,
	      htmlCode
	    };
	  });
	  
	  return parsedArray;
};

const initEditor = () => {
    nextTick(() => {
 		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
	        noSemanticValidation: true,
	        noSyntaxValidation: false,
      	})
  	 	// 设置 CSS 语言配置
	    monaco.languages.css.cssDefaults.setOptions({
	      validate: true,
	      lint: {
	        compatibleVendorPrefixes: 'warning',
	        vendorPrefix: 'warning',
	        duplicateProperties: 'warning',
	        emptyRules: 'warning',
	        importStatement: 'warning',
	        boxModel: 'warning',
	        universalSelector: 'warning',
	        zeroUnits: 'warning',
	        fontFaceProperties: 'warning',
	        hexColorLength: 'warning',
	        argumentsInColorFunction: 'warning',
	        unknownProperties: 'warning',
	        ieHack: 'ignore',
	        unknownVendorSpecificProperties: 'warning',
	        propertyIgnoredDueToDisplay: 'warning',
	        important: 'warning',
	        float: 'warning',
	        idSelector: 'warning'
	      }
	    });
 		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
   			target: monaco.languages.typescript.ScriptTarget.Latest,
      	 	allowNonTsExtensions: true,
      		moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      		module: monaco.languages.typescript.ModuleKind.CommonJS,
      		noEmit: true,
      		typeRoots: ["node_modules/@types"],
      	})

 		// 定义自定义主题
	    monaco.editor.defineTheme('myCustomTheme', {
	      base: 'vs-dark',
	      inherit: true,
	      rules: [
	        { token: 'comment', foreground: '6A9955' },
	        { token: 'keyword', foreground: '569CD6' },
	        { token: 'string', foreground: 'CE9178' },
	        // 添加更多自定义规则...
	      ],
	      colors: {
	        'editor.background': '#1E1E1E',
	        'editor.foreground': '#D4D4D4',
	        'editorCursor.foreground': '#FFFFFF',
	        'editor.lineHighlightBackground': '#2A2A2A',
	        'editorLineNumber.foreground': '#858585',
	        'editor.selectionBackground': '#264F78',
	        'editor.inactiveSelectionBackground': '#3A3D41',
	      }
	    });

 		!editor
        ? (editor = monaco.editor.create(editorRef.value, {
            value:  codeValue.value, // 编辑器初始显示文字
            language: language.value, // 语言支持自行查阅demo
            automaticLayout: true, // 自适应布局
            // theme: 'vs-dark', // 官方自带三种主题vs, hc-black, or vs-dark
            theme: 'myCustomTheme',
            foldingStrategy: 'indentation', // 代码可分小段折叠
            renderLineHighlight: 'all', // 行亮
            selectOnLineNumbers: true, // 显示行号
            minimap: {
              enabled: false,
            },
            readOnly: true, // 只读
            fontSize: 12, // 字体大小
            scrollBeyondLastLine: false, // 取消代码后面一大段空白
            overviewRulerBorder: false, // 不要滚动条的边框
            wordWrap: 'on', // 自动换行
            tabSize: 2, // tab 缩进长度
            acceptSuggestionOnCommitCharacter: true, // 接受关于提交字符的建议
            acceptSuggestionOnEnter: 'on', // 接受输入建议 "on" | "off" | "smart"
            // accessibilityPageSize: 10, // 辅助功能页面大小 Number 说明：控制编辑器中可由屏幕阅读器读出的行数。警告：这对大于默认值的数字具有性能含义。
            // accessibilitySupport: 'on', // 辅助功能支持 控制编辑器是否应在为屏幕阅读器优化的模式下运行。
            autoClosingBrackets: 'always', // 是否自动添加结束括号(包括中括号) "always" | "languageDefined" | "beforeWhitespace" | "never"
            // autoClosingDelete: 'always', // 是否自动删除结束括号(包括中括号) "always" | "never" | "auto"
            // autoClosingOvertype: 'always', // 是否关闭改写 即使用insert模式时是覆盖后面的文字还是不覆盖后面的文字 "always" | "never" | "auto"
            // autoClosingQuotes: 'always', // 是否自动添加结束的单引号 双引号 "always" | "languageDefined" | "beforeWhitespace" | "never"
            autoIndent: 'None', // 控制编辑器在用户键入、粘贴、移动或缩进行时是否应自动调整缩进
            automaticLayout: true, // 自动布局
            // codeLens: false, // 是否显示codeLens 通过 CodeLens，你可以在专注于工作的同时了解代码所发生的情况 – 而无需离开编辑器。 可以查找代码引用、代码更改、关联的 Bug、工作项、代码评审和单元测试。
            // codeLensFontFamily: '', // codeLens的字体样式
            // codeLensFontSize: 14, // codeLens的字体大小
            colorDecorators: false, // 呈现内联色彩装饰器和颜色选择器
            // comments: {
            //   ignoreEmptyLines: true, // 插入行注释时忽略空行。默认为真。
            //   insertSpace: true // 在行注释标记之后和块注释标记内插入一个空格。默认为真。
            // }, // 注释配置
            // contextmenu: true, // 启用上下文菜单
            // columnSelection: false, // 启用列编辑 按下shift键位然后按↑↓键位可以实现列选择 然后实现列编辑
            // autoSurround: 'never', // 是否应自动环绕选择
            copyWithSyntaxHighlighting: true, // 是否应将语法突出显示复制到剪贴板中 即 当你复制到word中是否保持文字高亮颜色
            // cursorBlinking: 'Solid', // 光标动画样式
            // cursorSmoothCaretAnimation: true, // 是否启用光标平滑插入动画  当你在快速输入文字的时候 光标是直接平滑的移动还是直接"闪现"到当前文字所处位置
            // cursorStyle: 'UnderlineThin', // "Block"|"BlockOutline"|"Line"|"LineThin"|"Underline"|"UnderlineThin" 光标样式
            // cursorSurroundingLines: 0, // 光标环绕行数 当文字输入超过屏幕时 可以看见右侧滚动条中光标所处位置是在滚动条中间还是顶部还是底部 即光标环绕行数 环绕行数越大 光标在滚动条中位置越居中
            // cursorSurroundingLinesStyle: 'all', // "default" | "all" 光标环绕样式
            // cursorWidth: 2, // <=25 光标宽度
            minimap: {
              enabled: false // 是否启用预览图
            }, // 预览图设置
            folding: true, // 是否启用代码折叠
            // links: true, // 是否点击链接
            overviewRulerBorder: true, // 是否应围绕概览标尺绘制边框
            renderLineHighlight: 'gutter', // 当前行突出显示方式
            roundedSelection: false, // 选区是否有圆角
            scrollBeyondLastLine: false, // 设置编辑器是否可以滚动到最后一行之后
          }))
        : editor.setValue('')

     	
      	// 监听编辑器内容变化
	    editor.onDidChangeModelContent((event) => {
      		// 使用防抖的 emit 函数
      		debouncedEmit(language.value);
	    });

	    // 创建一个防抖的 emits 函数
	    const debouncedEmit = debounce((type) => {

    	// 获取当前模型的所有标记（包括错误和警告）
	    const model = editor.getModel();
	    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
	       // 过滤出错误级别的标记
	    const errors = markers.filter(marker => marker.severity === monaco.MarkerSeverity.Error);
		    if (errors.length > 0) {
		       // 如果有错误，显示第一个错误信息
		       const firstError = errors[0];
		       const errorMessage = `${type.toLowerCase()} 内容在第 ${firstError.startLineNumber} 行发生错误`;
		       // 显示错误消息，这里你可以使用你喜欢的任何方式来显示错误
		       // 例如，使用 element-plus 的 ElMessage
		       ElMessage.error(errorMessage);
		       return
		    }

			const currentValue = editor.getValue();
			const formattedCode = formatCode(currentValue, type);
			if (formattedCode !== currentValue) {
		        const position = editor.getPosition();
		        editor.setValue(formattedCode);
		        editor.setPosition(position);
	      	}

      		editorStore.setIsUpdatingFromEditor(true);
      		emits('updataCode', { 
    			[type === 'javascript' ? 'jsCodeVal' : 
     			type === 'css' ? 'cssCodeVal' : 'parsedArray']: 
     			type === 'html' ? parseHtmlWithIdx(formattedCode) : formattedCode,
        		type: type
      		});
	    }, 1000); // 1秒的延迟
    })
}

// 格式化代码的辅助函数
const formatCode = (code, lang) => {
  switch (lang) {
    case 'html':
      return htmlBeautify(code, { indent_size: 2, wrap_line_length: 80 });
    case 'css':
      return cssBeautify(code, { indent_size: 2 });
    case 'javascript':
      return jsBeautify(code, { indent_size: 2, space_in_empty_paren: true });
    default:
      return code;
  }
};

// 在 setup 函数顶部添加这个辅助函数
const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 修改编辑器配置
const updateEditorOptions = ()=>{
	if(language.value === 'javascript'){
		editor.updateOptions({ readOnly: false});
	}
}

// 监听 props 的变化并更新编辑器
watch(() => codeValue.value, (newValue) => {
    nextTick(() => {
	  	const formattedCode = formatCode(newValue, language.value);
	    editor.setValue(formattedCode);
	    editor.updateOptions({ readOnly: !formattedCode.trim() });
	})
}
);

onMounted(() => {
	initEditor()
});

onBeforeUnmount(() => {
  editor.dispose()
});

defineExpose({updateEditorOptions})

</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
.monacoEditor {
  width: 100%;
  height: 100%;
}
</style>
