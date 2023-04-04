import MextScanner from './MextScanner';
import SpecialPhrase from './types/SpecialPhrase';
import MextUtils from '../MextUtils';

class MextParser {
	private readonly targetElement: HTMLElement;
	private readonly specialChars: number[];
	private readonly scanner: MextScanner;

	constructor(targetElement: HTMLElement) {
		this.targetElement = targetElement;
		this.scanner = new MextScanner();
		this.specialChars = [];
	}

	public parse = (): SpecialPhrase[] => {
		const phrases: SpecialPhrase[] = [];

		const text = this.targetElement.textContent;
		if (text === null) {
			throw new Error('failed to get a string to scan');
		}
		this.scanner.load(text);

		let codePoint: number | null = 0;
		while (true) {
			codePoint = this.scanner.peek();
			if (codePoint === null) {
				break;
			}

			const specialPhrase = this.parseSpecialChars();
			if (specialPhrase !== null) {
				phrases.push(specialPhrase);
			}

			this.scanner.moveForward();
		}

		return phrases;
	};

	public appendSpecialChar = (codePoint: number) => {
		this.specialChars.push(codePoint);
	};

	public convertToCodePoints = (data: string) => {
		const points: number[] = [];
		this.scanner.load(data);

		let point = this.scanner.peek();
		while (point !== null) {
			points.push(point);
			this.scanner.moveForward();
			point = this.scanner.peek();
		}

		return points;
	};

	private parseSpecialChars = (): SpecialPhrase | null => {
		const startChar = this.scanner.peek();
		if (startChar === null) {
			throw new Error('start char is null');
		}

		const isSpecialChar = this.specialChars.includes(startChar);
		if (!isSpecialChar) {
			return null;
		}

		this.scanner.moveBack();
		const prevChar = this.scanner.peek();
		this.scanner.skip(1);
		if (prevChar === null) {
			return null;
		}
		const isValidPrevChar = MextUtils.isWhitespace(prevChar);
		if (!isValidPrevChar) {
			return null;
		}


		const startPosition = this.scanner.getCursor();
		const phrase = this.getEmptyPhrase(startChar, startPosition);

		this.scanner.moveForward();

		let codePoint = this.scanner.peek();
		while (codePoint !== null) {
			const isAlpha = MextUtils.isAlpha(codePoint);
			if (!isAlpha) {
				break;
			}

			this.scanner.consume();
			this.scanner.moveForward();
			codePoint = this.scanner.peek();
		}

		const consumedChars = this.scanner.getConsumedChars();
		if (consumedChars.length === 0) {
			return null;
		}
		phrase.content = consumedChars;
		phrase.codePointCount = consumedChars.length + 1;

		return phrase;
	};

	private getEmptyPhrase = (specialChar: number, position: number): SpecialPhrase => ({
		position,
		specialChar,
		content: [],
		codePointCount: 0,
	});
}

export default MextParser;
