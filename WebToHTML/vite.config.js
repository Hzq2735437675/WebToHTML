import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'


// https://vitejs.dev/config/
const pathResolve = (dir)=>{
	return resolve(process.cwd(),'.',dir)
}
export default defineConfig({
  plugins: [vue()],
  base:'./',
  entry:'index.html',
  resolve:{
  	alias:{
  		'@':pathResolve('src')
  	}
  },
  optimizeDeps: {
    include: [
      `monaco-editor/esm/vs/language/json/json.worker`,
      `monaco-editor/esm/vs/language/css/css.worker`,
      `monaco-editor/esm/vs/language/html/html.worker`,
      `monaco-editor/esm/vs/language/typescript/ts.worker`,
      `monaco-editor/esm/vs/editor/editor.worker`
    ], 
  },
})
