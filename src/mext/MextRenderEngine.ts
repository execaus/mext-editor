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

	private readonly targetElement: HTMLElement;

	constructor(targetElement: HTMLElement) {
		this.targetElement = targetElement;
	}

	public render = (updatedModel: MextModel) => {
		const nodes = this.targetElement.childNodes;

		// Пройдемся по всем токенам и обновим их содержимое в HTML
		updatedModel.tokens.forEach((token, i) => {
			const node = nodes[i];

			if (node instanceof HTMLElement) {
				// Обновляем содержимое текстового токена
				if (token.type === MextTokenType.String) {
					node.textContent = String.fromCodePoint(...token.content);
					node.style.color = token.color;
					node.style.fontSize = token.fontSize;
					node.style.fontFamily = token.fontFamily;
				}

				// Обновляем содержимое динамического поля
				if (token.type === MextTokenType.DynamicField) {
					node.classList.add(this.DYNAMIC_FIELD_CSS_CLASS);
					node.textContent = String.fromCodePoint(CharCode.Hash, ...token.content);
					node.style.color = token.color;
					node.style.fontSize = token.fontSize;
					node.style.fontFamily = token.fontFamily;
				}

				// Обновляем формат
				if (token.format & MextFormat.Bold) {
					node.classList.add(this.BOLD_CSS_CLASS);
				} else {
					node.classList.remove(this.BOLD_CSS_CLASS);
				}

				if (token.format & MextFormat.Italic) {
					node.classList.add(this.ITALIC_CSS_CLASS);
				} else {
					node.classList.remove(this.ITALIC_CSS_CLASS);
				}
			}
		});

		// Удаляем из HTML лишние токены
		while (nodes.length > updatedModel.tokens.length) {
			this.targetElement.removeChild(nodes[nodes.length - 1]);
		}

		// Добавляем в HTML новые токены
		for (let i = nodes.length; i < updatedModel.tokens.length; i++) {
			const token = updatedModel.tokens[i];
			this.pushRenderedToken(token);
		}
	};

	private pushRenderedToken = (token: MextToken) => {
		const elem = this.getTokenElement(token);
		this.targetElement.append(elem);
	};

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
			elem = document.createElement('span');
			elem.textContent = '\n';
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
