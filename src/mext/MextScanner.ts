class MextScanner {
	private cursor: number;
	private scannerString: string;
	private consumedContent: number[];

	constructor() {
		this.cursor = 0;
		this.scannerString = '';
		this.consumedContent = [];
	}

	public load = (scannerString: string) => {
		this.cursor = 0;
		this.scannerString = scannerString;
	};

	public moveForward = () => {
		this.cursor++;
	};

	public moveBack = () => {
		this.cursor--;
	};

	public skip = (length: number) => {
		this.cursor += length;
	};

	public peek = (): number | null => {
		const point = this.scannerString.codePointAt(this.cursor);
		if (point === undefined) {
			return null;
		}
		return point;
	};

	public setCursor = (cursor: number) => {
		this.cursor = cursor;
	};

	public consume = () => {
		const codePoint = this.peek();
		if (codePoint === null) {
			throw new Error('code point is null');
		}
		this.consumedContent.push(codePoint);
	};

	public getConsumedChars = (): number[] => {
		const chars = [...this.consumedContent];
		this.consumedContent = [];
		return chars;
	};

	public getCursor = (): number => this.cursor;
	public getCodePointCount = (): number => {
		const memorizeCursor = this.cursor;

		this.cursor = 0;
		let count = 0;
		let char = this.peek();
		while (char !== null) {
			count++;
			this.moveForward();
			char = this.peek();
		}

		this.cursor = memorizeCursor;
		return count;
	};
}

export default MextScanner;
