import MextModel from './types/MextModel';
import MextToken from './tokens/MextToken';
import MextTokenType from './tokens/MextTokenType';
import MextTokenString from './tokens/MextTokenString';
import MextFormat from './types/MextFormat';
import CharCode from './types/CharCode';

class MextRenderEngine {
	private readonly BOLD_CSS_CLASS = 'mext-b';
	private readonly ITALIC_CSS_CLASS = 'mext-i';
	private readonly DYNAMIC_FIELD_CSS_CLASS = 'mext-df';
	private readonly TEXT_NODE_TYPE = 3;

	private readonly targetElement: HTMLElement;
	private readonly breakElement: HTMLElement;

	constructor(targetElement: HTMLElement) {
		this.targetElement = targetElement;
		this.breakElement = document.createElement('br');
	}

	public render = (updatedModel: MextModel) => {
		const { tokens } = updatedModel;
		const rowsElements: Map<HTMLElement, HTMLElement[]> = new Map<HTMLElement, HTMLElement[]>();
		const rows: HTMLElement[] = [];

		// Сформировать карту текущего состояния DOM. Удалить текстовые узлы на местах строк.
		this.targetElement.childNodes.forEach(rowNode => {
			if (rowNode.nodeType === this.TEXT_NODE_TYPE) {
				rowNode.remove();
				return;
			}

			if (rowNode instanceof HTMLElement) {
				const tokenElements: HTMLElement[] = [];
				const tokenNodes = rowNode.childNodes;

				tokenNodes.forEach(tokenNode => {
					if (tokenNode.nodeType === this.TEXT_NODE_TYPE) {
						tokenNode.remove();
						return;
					}

					if (tokenNode instanceof HTMLElement) {
						if (tokenNode.nodeName !== 'BR') {
							tokenElements.push(tokenNode);
						}
					} else {
						throw new Error('token node not html element');
					}
				});

				rows.push(rowNode);
				rowsElements.set(rowNode, tokenElements);
			} else {
				throw new Error('row node not html element');
			}
		});

		if (tokens.length === 0 || (tokens.length === 1 && tokens[0].content.length === 0)) {
			this.renderEmpty(rows);
			return;
		}

		if (this.breakElement.isConnected) {
			this.breakElement.remove();
		}

		let rowIndex = 0;
		let elementIndex = 0;
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			let isMutateElement = true;

			let rowElement = rows[rowIndex];
			if (rowElement === undefined) {
				const createdRow = this.getRowElement();
				rows.push(createdRow);
				rowsElements.set(createdRow, []);
				this.targetElement.append(createdRow);
				rowElement = createdRow;
			}

			const rowElements = rowsElements.get(rowElement);
			if (rowElements === undefined) {
				throw new Error('row elements not found');
			}
			const tokenElement = rowElements[elementIndex];
			if (tokenElement === undefined) {
				const elem = this.getTokenElement(token);
				rowElement.append(elem);
				isMutateElement = false;
			}

			if (token.type === MextTokenType.NewLine) {
				rowIndex++;
				elementIndex = 0;
				for (let j = i; j < rowElements.length; j++) {
					const elem = rowElements[j];
					elem.remove();
				}
				isMutateElement = false;
			}

			if (isMutateElement) {
				// Обновляем содержимое текстового токена
				if (token.type === MextTokenType.String) {
					const requireContent = String.fromCodePoint(...token.content);
					if (tokenElement.textContent !== requireContent) {
						tokenElement.textContent = requireContent;
					}
					tokenElement.style.color = token.color;
					tokenElement.style.fontSize = token.fontSize;
					tokenElement.style.fontFamily = token.fontFamily;
				}

				// Обновляем содержимое динамического поля
				if (token.type === MextTokenType.DynamicField) {
					tokenElement.classList.add(this.DYNAMIC_FIELD_CSS_CLASS);
					tokenElement.textContent = String.fromCodePoint(CharCode.Hash, ...token.content);
					tokenElement.style.color = token.color;
					tokenElement.style.fontSize = token.fontSize;
					tokenElement.style.fontFamily = token.fontFamily;
				}

				// Обновляем формат
				if (token.format & MextFormat.Bold) {
					tokenElement.classList.add(this.BOLD_CSS_CLASS);
				} else {
					tokenElement.classList.remove(this.BOLD_CSS_CLASS);
				}

				if (token.format & MextFormat.Italic) {
					tokenElement.classList.add(this.ITALIC_CSS_CLASS);
				} else {
					tokenElement.classList.remove(this.ITALIC_CSS_CLASS);
				}
			}

			elementIndex++;
		}

		// Удаляем не нужные элементы в строке
		const rowElement = rows[rowIndex];
		if (rowElement === undefined) {
			throw new Error('row not found');
		}

		const rowElements = rowsElements.get(rowElement);
		if (rowElements === undefined) {
			throw new Error('row elements not found');
		}

		for (let i = elementIndex; i < rowElements.length; i++) {
			rowElements[i].remove();
		}
	};

	private renderEmpty = (rows: HTMLElement[]) => {
		if (rows.length > 0) {
			for (let i = 1; i < rows.length; i++) {
				rows[i].remove();
			}
		}

		let row = rows[0];
		if (row === undefined) {
			row = this.getRowElement();
			row.append(this.breakElement);
			this.targetElement.append(row);
			return;
		}

		if (row instanceof HTMLElement) {
			row.innerHTML = '';
			row.append(this.breakElement);
		} else {
			throw new Error('first row not html element');
		}
	};

	private pushRenderedToken = (token: MextToken) => {
		const elem = this.getTokenElement(token);
		this.targetElement.append(elem);
	};

	private getRowElement = (): HTMLElement => document.createElement('div');

	private getTokenElement = (token: MextToken) => {
		let elem: HTMLElement;

		switch (token.type) {
		case MextTokenType.String: {
			const stringToken = token as MextTokenString;

			elem = document.createElement('span');
			elem.textContent = String.fromCodePoint(...stringToken.content);
			elem.style.font = stringToken.fontFamily;
			elem.style.fontSize = stringToken.fontSize;
			elem.style.color = stringToken.color;
			this.setFormat(elem, stringToken.format);

			break;
		}
		case MextTokenType.Link:
			elem = document.createElement('a');
			break;
		case MextTokenType.DynamicField:
			elem = document.createElement('span');
			elem.classList.add('mext-df');
			break;
		case MextTokenType.NewLine:
			elem = document.createElement('br');
			break;
		default: throw new Error(`token (${token.type}) not found`);
		}

		return elem;
	};

	private setFormat = (elem: HTMLElement, format: number) => {
		if (format === MextFormat.None) {
			elem.classList.remove(this.BOLD_CSS_CLASS);
			elem.classList.remove(this.ITALIC_CSS_CLASS);
			return;
		}

		if (format & MextFormat.Bold) {
			elem.classList.add(this.BOLD_CSS_CLASS);
		} else {
			elem.classList.remove(this.BOLD_CSS_CLASS);
		}

		if (format & MextFormat.Italic) {
			elem.classList.add(this.ITALIC_CSS_CLASS);
		} else {
			elem.classList.remove(this.ITALIC_CSS_CLASS);
		}
	};
}

export default MextRenderEngine;
