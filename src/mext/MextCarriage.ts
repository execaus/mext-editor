import MextRange from './types/MextRange';
import MextScanner from './MextScanner';

class MextCarriage {
	private readonly targetElement: HTMLElement;
	private readonly scanner: MextScanner;

	constructor(targetElement: HTMLElement) {
		this.targetElement = targetElement;
		this.scanner = new MextScanner();
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
		const nodes = this.targetElement.childNodes;

		let currentPosition = 0;
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node.textContent === null) {
				throw new Error('text content not found');
			}

			if (position >= currentPosition && position <= currentPosition + node.textContent.length) {
				const relativePosition = currentPosition + node.textContent.length - position;
				if (node.firstChild === null) {
					throw new Error('text node not found');
				}
				range.setStart(node.firstChild, relativePosition);
				range.collapse(true);

				const sel = window.getSelection();
				if (sel === null) {
					return;
				}
				sel.removeAllRanges();
				sel.addRange(range);
				break;
			}

			currentPosition += node.textContent.length;
		}
	};

	public getSelection = (): MextRange | null => {
		const selection = window.getSelection();
		if (selection === null) {
			return null;
		}

		const nodes = this.targetElement.childNodes;
		if (selection.anchorNode === null || selection.focusNode === null) {
			return null;
		}

		let startOffset = 0;
		let currentPosition = 0;

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];

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

	private getCharCount = (str: string | null): number => {
		if (str === null) {
			return 0;
		}
		this.scanner.load(str);
		return this.scanner.getCodePointCount();
	};
}

export default MextCarriage;
