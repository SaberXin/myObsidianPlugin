import { Plugin, Editor, TFile } from 'obsidian';
import * as child_process from 'child_process';
import * as path from 'path';

export default class DrawIOPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'open-draw-io',
      name: 'Insert draw.io',
      editorCallback: async (editor, view) => {
        await this.insertDrawio(editor, view.file);
      },
    });
  }

  async insertDrawio(editor: Editor, file: TFile) {
	if (!file) return;
  
	const attachmentsFolderName = 'attachments';
  	const svgFileName = 'untitled.svg';
  	const attachmentsPath = path.join(file.parent.path, attachmentsFolderName);
  	const svgFilePath = path.join(attachmentsPath, svgFileName);
  	const svgFileLink = `![[${attachmentsFolderName}/${svgFileName}]]`;
  
	// draw.io 空文件的基本内容
	const EMPTY_DIAGRAM_SVG = `<?xml version="1.0" encoding="UTF-8"?>
	<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
	<svg
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	version="1.1" width="1px" height="1px"
	viewBox="-0.5 -0.5 1 1"
	content="&lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id=&quot;0&quot;/&gt;&lt;mxCell id=&quot;1&quot; parent=&quot;0&quot;/&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;">
	</svg>`;
  
	try {
	  // 检查attachments目录是否存在，如果不存在则创建
	   if (!this.app.vault.getAbstractFileByPath(attachmentsPath)) {
		await this.app.vault.createFolder(attachmentsPath);
	  }	

	  // 创建一个基本的draw.io文件
	  await this.app.vault.create(svgFilePath, EMPTY_DIAGRAM_SVG);
  
	  // 在当前光标位置插入链接
	  editor.replaceSelection(svgFileLink);
  
	  // 获取绝对路径
	  const fullSvgFilePath = this.app.vault.adapter.getFullPath(svgFilePath);
	  
	  // 打印路径用于调试
	  console.log("Opening file at path:", fullSvgFilePath);
	  
	  // 打开draw.io应用
	  child_process.exec(`open -a draw.io.app "${fullSvgFilePath}"`, (err) => {
	    if (err) {
	      console.error('Error opening draw.io:', err);
	    } else {
	      console.log('draw.io opened successfully');
	    }
	  });
	} catch (error) {
	  console.error('Error handling draw.io file:', error);
	}
  }
}