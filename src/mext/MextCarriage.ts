import MextRange from './types/MextRange';
import MextScanner from './MextScanner';

class MextCarriage {
	private readonly targetElement: HTMLElement;
	private readonly scanner: MextScanner;

	private readonly subscribers: (() => void)[];

	constructor(targetElement: HTMLElement) {
		this.targetElement = targetElement;
		this.scanner = new MextScanner();
		this.subscribers = [];

		document.addEventListener('selectionchange', this.onSelectionChange);
	}

	public getPosition = (): number | null => {
		const selection = document.getSelection();
		if (selection === null || selection.anchorNode === null) {
			return null;
		}
		const range = new Range();
		range.setStart(this.targetElement, 0);
		range.setEnd(selection.anchorNode, selection.anchorOffset);
		return range.toString().replace('\n', '').length;
	};

	public setPosition = (position: number) => {
		const range = document.createRange();
		const tokenElements = this.getTokenElements();

		let currentPosition = 0;
		for (let i = 0; i < tokenElements.length; i++) {
			const tokenElement = tokenElements[i];
			const nodeCharCount = this.getCharCount(tokenElement.textContent);

			if (tokenElement.textContent === null) {
				throw new Error('text content not found');
			}

			if (position >= currentPosition && position <= currentPosition + nodeCharCount) {
				const relativePosition = position - currentPosition;
				if (tokenElement.firstChild === null) {
					range.setStart(tokenElement, relativePosition);
				} else {
					range.setStart(tokenElement.firstChild, relativePosition);
				}
				range.collapse(true);

				const sel = window.getSelection();
				if (sel === null) {
					return;
				}
				sel.removeAllRanges();
				sel.addRange(range);
				break;
			}

			currentPosition += nodeCharCount;
		}
	};

	public setRange = (selectRange: MextRange) => {
		const range = document.createRange();
		const tokenElements = this.getTokenElements();

		let currentPosition = 0;
		for (let i = 0; i < tokenElements.length; i++) {
			const tokenElement = tokenElements[i];
			const nodeCharCount = this.getCharCount(tokenElement.textContent);

			if (tokenElement.textContent === null) {
				throw new Error('text content not found');
			}

			if (selectRange.start >= currentPosition && selectRange.start <= currentPosition + nodeCharCount) {
				if (tokenElement.firstChild === null) {
					throw new Error('text node not found');
				}

				const relativePosition = selectRange.start - currentPosition;
				range.setStart(tokenElement.firstChild, relativePosition);
			}

			if (selectRange.end >= currentPosition && selectRange.end <= currentPosition + nodeCharCount) {
				if (tokenElement.firstChild === null) {
					throw new Error('text node not found');
				}

				const relativePosition = selectRange.end - currentPosition;
				range.setEnd(tokenElement.firstChild, relativePosition);
				break;
			}

			currentPosition += nodeCharCount;
		}

		const sel = window.getSelection();
		if (sel === null) {
			return;
		}
		sel.removeAllRanges();
		sel.addRange(range);
	};

	public getSelection = (): MextRange | null => {
		const selection = window.getSelection();
		if (selection === null) {
			return null;
		}

		const tokenElements = this.getTokenElements();

		if (selection.anchorNode === null || selection.focusNode === null) {
			return null;
		}

		let startOffset = 0;
		let currentPosition = 0;

		for (let i = 0; i < tokenElements.length; i++) {
			const node = tokenElements[i];

			if (node === selection.anchorNode.parentElement) {
				startOffset = currentPosition + selection.anchorOffset;
				break;
			} else {
				currentPosition += this.getCharCount(node.textContent);
			}
		}

		this.scanner.load(selection.toString());
		return {
			start: startOffset,
			end: startOffset + this.scanner.getCodePointCount(),
			length: this.scanner.getCodePointCount(),
		};
	};

	public subscribeChange = (subscriber: () => void) => {
		this.subscribers.push(subscriber);
	};

	private onSelectionChange = () => {
		const selection = this.getSelection();
		if (selection === null) {
			return;
		}
		this.callSubscribers();
	};

	private callSubscribers = () => {
		this.subscribers.forEach(subscriber => subscriber());
	};

	private getCharCount = (str: string | null): number => {
		if (str === null) {
			return 0;
		}
		this.scanner.load(str);
		return this.scanner.getCodePointCount();
	};

	private getTokenElements = (): HTMLElement[] => {
		const rows = this.targetElement.childNodes;
		const tokenElements: HTMLElement[] = [];

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			for (let j = 0; j < row.childNodes.length; j++) {
				const tokenElement = row.childNodes[j];
				if (tokenElement instanceof HTMLElement) {
					tokenElements.push(tokenElement);
				} else {
					throw new Error('token element is not html element');
				}
			}
		}

		return tokenElements;
	};
}

export default MextCarriage;
