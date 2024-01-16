import { Modal, App, Plugin, Editor, TFile } from 'obsidian';
import * as child_process from 'child_process';
import * as path from 'path';


const XMIND_TEMPLATE_PATH = `template/template.xmind`

const EMPTY_DIAGRAM_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg
xmlns="http://www.w3.org/2000/svg"
xmlns:xlink="http://www.w3.org/1999/xlink"
version="1.1" width="1px" height="1px"
viewBox="-0.5 -0.5 1 1"
content="&lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id=&quot;0&quot;/&gt;&lt;mxCell id=&quot;1&quot; parent=&quot;0&quot;/&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;">
</svg>`;


// FileNameModal类
class FileNameModal extends Modal {
  onSubmit: (value: string) => void;
  fileExtension: string;

  constructor(app: App, fileExtension: string, onSubmit: (value: string) => void) {
    super(app);
    this.fileExtension = fileExtension;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    let { contentEl } = this;

    contentEl.addClass('quick-insert-modal');

    contentEl.createEl('h3', { text: 'Enter File Name' });

    let inputEl = contentEl.createEl('input', {
      type: 'text',
      placeholder: 'Filename (e.g., diagram.svg)'
    });
    inputEl.addClass('quick-insert-input');

    inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && inputEl.value) {
        this.onSubmit(`${inputEl.value}${this.fileExtension}`);
        this.close();
      }
    });

	let buttonDiv = contentEl.createDiv('quick-insert-modal-button-container');

    let submitBtn = buttonDiv.createEl('button', {
      text: 'Submit',
      cls: 'mod-cta quick-insert-button'
    });

    submitBtn.addEventListener('click', () => {
      if (inputEl.value) {
        this.onSubmit(`${inputEl.value}${this.fileExtension}`);
        this.close();
      }
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}


// 插件逻辑
export default class QuickInsertPlugin extends Plugin {
  async onload() {
	this.addCommand({
	  id: 'open-draw-io',
	  name: 'Insert draw.io',
	  editorCallback: async (editor, view) => {
		await this.insertFile(editor, view.file, '.svg', 'draw.io.app');
	  },
	});
  
	this.addCommand({
	  id: 'open-xmind',
	  name: 'Insert xmind',
	  editorCallback: async (editor, view) => {
		await this.insertFile(editor, view.file, '.xmind', 'Xmind.app');
	  },
	});
  }

  async insertFile(editor: Editor, file: TFile, fileExtension: string, appName: string) {
	if (!file) return;

	// 保存当前的光标位置
	const cursorPosition = editor.getCursor();
  
	new FileNameModal(this.app, fileExtension, async (fileName: string) => {
		const attachmentsFolderName = 'attachments';
		const attachmentsPath = path.join(file.parent.path, attachmentsFolderName);
		const filePath = path.join(attachmentsPath, fileName);
		const fileLink = `![[${attachmentsFolderName}/${fileName}]]`;	

		try {
			// 检查attachments目录是否存在，如果不存在则创建
			if (!this.app.vault.getAbstractFileByPath(attachmentsPath)) {
				await this.app.vault.createFolder(attachmentsPath);
			}	
		
			// 创建一个基本空文件
			// 根据文件扩展名决定如何创建文件
			if (fileExtension === '.svg') {
				// 对于SVG文件，使用特定的内容
				await this.app.vault.create(filePath, EMPTY_DIAGRAM_SVG);
			} else if (fileExtension === '.xmind') {
				// 对于XMind文件，复制模板文件
				// 假设模板文件路径为 'path/to/your/template.xmind'
				const templatePath = XMIND_TEMPLATE_PATH;
				const templateContent = await this.app.vault.adapter.readBinary(templatePath);
				await this.app.vault.createBinary(filePath, templateContent);
			}
		  
			// 在当前光标位置插入链接
			editor.setCursor(cursorPosition);
			editor.replaceSelection(fileLink);
  
			// 打开对应的应用程序
			const fullFilePath = this.app.vault.adapter.getFullPath(filePath);

			// 打印路径用于调试
			console.log("Opening file at path:", fullFilePath);

			child_process.exec(`open -a ${appName} "${fullFilePath}"`, (err) => {
				if (err) {
					console.error('Error opening file with ${appName}:', err);
				} else {
					console.log('${appName} opened successfully');
		  		}
			});
		} catch (error) {
			console.error('Error handling file for ${appName}:', error);
		}
	}).open();
  }

}