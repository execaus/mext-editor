import MextRenderEngine from './MextRenderEngine';
import MextModel from './types/MextModel';
import TextAlign from './types/TextAlign';
import MextParser from './MextParser';
import MextCarriage from './MextCarriage';
import CharCode from './types/CharCode';
import MextToken from './tokens/MextToken';
import SpecialPhrase from './types/SpecialPhrase';
import MextFormat from './types/MextFormat';
import MextCarriageTokenPosition from './types/MextCarriageTokenPosition';
import FontSize from './types/FontSize';
import MextState from './MextState';
import TokensState from './tokens/state/TokensState';
import MextTokenMutator from './tokens/MextTokenMutator';
import MextTokenRange from './tokens/state/MextTokenRange';
import MextRange from './types/MextRange';

class Mext {
	private readonly CSS_MEXT_CLASS: string = 'mext-editor';

	private readonly targetElement: HTMLElement;
	private readonly tokensState: TokensState;
	private readonly tokenMutator: MextTokenMutator;
	private readonly renderEngine: MextRenderEngine;
	private readonly parser: MextParser;
	private readonly carriage: MextCarriage;
	private readonly state: MextState;

	private isEditable: boolean;

	constructor(targetElement: HTMLElement) {
		this.isEditable = false;
		this.targetElement = targetElement;

		this.parser = new MextParser(this.targetElement);
		this.parser.appendSpecialChar(CharCode.Hash);

		this.carriage = new MextCarriage(this.targetElement);
		this.tokensState = new TokensState();
		this.tokenMutator = new MextTokenMutator();
		this.renderEngine = new MextRenderEngine(this.targetElement);
		this.state = new MextState(this.renderEngine);
		this.setEventHandlers(this.targetElement);

		targetElement.classList.add(this.CSS_MEXT_CLASS);
	}

	public enableEditable = () => {
		this.isEditable = true;
		this.targetElement.contentEditable = 'true';
	};

	public disableEditable = () => {
		this.isEditable = false;
		this.targetElement.removeAttribute('contentEditable');
	};

	public setModel = (model: MextModel) => {
		this.state.updateAndRender(_ => model);
	};

	public setString = () => {
		// TODO
	};

	public setFormat = (format: MextFormat) => {
		const range = this.carriage.getSelection();
		const currentModel = this.state.getModel();

		const updatedTokens = this.tokenMutator.setFormat(currentModel.tokens, range, format);

		this.state.updateAndRender(prev => ({
			...prev,
			tokens: updatedTokens,
		}));

		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.carriage.setPosition(range.start);
			return;
		}

		this.carriage.setRange(range);
	};

	public setFontSize = (fontSize: FontSize) => {
		const range = this.carriage.getSelection();
		const currentModel = this.state.getModel();

		const updatedTokens = this.tokenMutator.setFontSize(currentModel.tokens, range, fontSize);

		this.state.updateAndRender(prev => ({
			...prev,
			tokens: updatedTokens,
		}));

		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.carriage.setPosition(range.start);
			return;
		}

		this.carriage.setRange(range);
	};

	public setColor = (color: string) => {
		const range = this.carriage.getSelection();
		const currentModel = this.state.getModel();

		const updatedTokens = this.tokenMutator.setColor(currentModel.tokens, range, color);

		this.state.updateAndRender(prev => ({
			...prev,
			tokens: updatedTokens,
		}));

		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.carriage.setPosition(range.start);
			return;
		}

		this.carriage.setRange(range);
	};

	public setFontFamily = (fontFamily: string) => {
		const range = this.carriage.getSelection();
		const currentModel = this.state.getModel();

		const updatedTokens = this.tokenMutator.setColor(currentModel.tokens, range, fontFamily);

		this.state.updateAndRender(prev => ({
			...prev,
			tokens: updatedTokens,
		}));

		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.carriage.setPosition(range.start);
			return;
		}

		this.carriage.setRange(range);
	};

	public setAlign = (align: TextAlign) => {
		this.state.updateAndRender(prev => ({
			...prev,
			align,
		}));
	};

	public setLineHeight = (lineHeight: number) => {
		this.state.updateAndRender(prev => ({
			...prev,
			lineHeight,
		}));
	};

	public subscribeModelChange = (subscriber: () => void) => {
		this.state.subscribeChange(subscriber);
	};

	public subscribeSelectionChange = (subscriber: (ranges: MextTokenRange[]) => void) => {
		const carriageSubscriber = this.getCarriageSubscriber(subscriber);
		this.carriage.subscribeChange(carriageSubscriber);
	};

	public setDefaultFontSize = (fontSize: FontSize) => {
		this.tokenMutator.setDefaultFontSize(fontSize);
	};

	public setDefaultColor = (color: string) => {
		this.tokenMutator.setDefaultColor(color);
	};

	public setDefaultFontFamily = (fontFamily: string) => {
		this.tokenMutator.setDefaultFontFamily(fontFamily);
	};

	public getModel = (): MextModel => this.state.getModel();

	private setEventHandlers = (element: HTMLElement) => {
		element.addEventListener('keydown', this.onKeyDown);
		element.addEventListener('input', this.onInput);
		element.addEventListener('beforeinput', this.onBeforeInput);
		element.addEventListener('paste', this.onPaste);
	};

	private onBeforeInput = (ev: InputEvent) => {
		const range = this.carriage.getSelection();
		if (range === null) {
			throw new Error('insert position not found');
		}

		const { tokens } = this.state.getModel();
		let updatedTokens: MextToken[] = [];

		switch (ev.inputType) {
		case 'insertText': {
			const insertContent = this.parseInsertContent(ev.data);

			updatedTokens = this.tokenMutator.insertContent(tokens, range, insertContent);

			requestAnimationFrame(this.carriage.setPosition.bind(this, range.start + 1));
			break;
		}
		case 'deleteContentBackward': {
			if (range.length === 0) {
				range.start -= 1;
				range.length = 1;
			}

			updatedTokens = this.tokenMutator.removeRange(tokens, range);
			this.tokenMutator.updateLastActualToken(tokens, updatedTokens);

			requestAnimationFrame(this.carriage.setPosition.bind(this, range.start));
			break;
		}
		case 'deleteContentForward': {
			if (range.length === 0) {
				range.end += 1;
				range.length = 1;
			}

			updatedTokens = this.tokenMutator.removeRange(tokens, range);
			this.tokenMutator.updateLastActualToken(tokens, updatedTokens);

			requestAnimationFrame(this.carriage.setPosition.bind(this, range.start));
			break;
		}
		default: break;
		}

		const specialPhrases = this.parser.parse();
		const normalizedTokens = this.normalizeTokens(updatedTokens, specialPhrases);

		this.state.updateAndRender(prev => ({
			...prev,
			tokens: normalizedTokens,
		}));

		ev.preventDefault();
	};

	private onInput = (ev: Event) => {
		ev.preventDefault();
	};

	private onPaste = (ev: ClipboardEvent) => {
		if (ev.clipboardData === null) {
			return;
		}
		const range = this.carriage.getSelection();
		if (range === null) {
			return;
		}

		const pasteText = ev.clipboardData.getData('text/plain');
		const currentModel = this.state.getModel();
		const updatedTokens = this.tokenMutator.insertContent(
			currentModel.tokens,
			range,
			this.parser.convertToCodePoints(pasteText),
		);
		this.state.updateAndRender(prev => ({
			...prev,
			tokens: updatedTokens,
		}));
		ev.preventDefault();
	};

	private onKeyDown = (ev: KeyboardEvent) => {
		if (!ev.shiftKey && ev.key === 'Enter') {
			ev.preventDefault();

			// const selection = this.carriage.getSelection();
			// if (selection === null) {
			// 	return;
			// }
			//
			// const currentModel = this.state.getModel();
			// const splitResult = this.splitTokens(currentModel.tokens, selection);
			//
			// const newLineToken: MextTokenNewLine = {
			// 	type: MextTokenType.NewLine,
			// 	format: 0,
			// 	fontFamily: '',
			// 	fontSize: FontSize.Pt16,
			// 	content: [],
			// 	color: '',
			// };
			//
			// const targetToken = splitResult.crossedTokens[0];
			// if (targetToken === undefined) {
			// 	return;
			// }
			//
			// const updatedSequence: MextToken[] = [];
			// splitResult.updatedSequence.forEach(token => {
			// 	if (token === targetToken) {
			// 		updatedSequence.push(newLineToken);
			// 	}
			// 	updatedSequence.push(token);
			// });
			//
			// this.state.updateAndRender(prev => ({
			// 	...prev,
			// 	tokens: updatedSequence,
			// }));
			//
			// if (selection.length > 0) {
			// 	// удалить выделенные токены
			// }
		}
		if (ev.shiftKey && ev.key === 'Enter') {
			ev.preventDefault();
		}
	};

	private normalizeTokens = (tokens: MextToken[], specialPhrases: SpecialPhrase[]): MextToken[] => {
		const result: MextToken[] = [...tokens];

		return result;
	};

	private parseInsertContent = (data: string | null): number[] => {
		if (data === null) {
			return [];
		}

		return this.parser.convertToCodePoints(data);
	};

	private getSelectedTokens = (tokens: MextToken[], selection: MextRange): MextTokenRange[] => {
		const result: MextTokenRange[] = [];

		if (selection === null) {
			tokens.forEach(token => {
				result.push({
					end: 0,
					start: 0,
					isFull: true,
					token,
				});
			});
			return result;
		}

		let isSelect = false;
		let currentPosition = 0;
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];

			if (!isSelect) {
				if (selection.start === currentPosition) {
					result.push({
						end: 0,
						start: 0,
						isFull: true,
						token,
					});
				}
				if (selection.start > currentPosition && selection.start < currentPosition + token.content.length) {
					result.push({
						end: currentPosition + token.content.length,
						start: selection.start - currentPosition,
						isFull: false,
						token,
					});
				}
				isSelect = true;
			} else {
				if (selection.end === currentPosition + token.content.length) {
					result.push({
						end: 0,
						start: 0,
						isFull: true,
						token,
					});
					break;
				}
				if (selection.end > currentPosition && selection.end < currentPosition + token.content.length) {
					result.push({
						start: 0,
						end: selection.end - currentPosition,
						isFull: true,
						token,
					});
					break;
				}
			}

			currentPosition += token.content.length;
		}

		return result;
	};

	private getCarriagePositionToken = (tokens: MextToken[], position: number): MextCarriageTokenPosition | null => {
		let currentPosition = 0;

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (position === currentPosition) {
				return {
					leftBound: true,
					rightBound: false,
					position: 0,
					token,
				};
			}
			if (position === currentPosition + token.content.length) {
				return {
					leftBound: false,
					rightBound: true,
					position: 0,
					token,
				};
			}
			if (position > currentPosition && position < currentPosition + token.content.length) {
				return {
					leftBound: false,
					rightBound: false,
					position: position - currentPosition,
					token,
				};
			}
			currentPosition += token.content.length;
		}

		return null;
	};

	private getCarriageSubscriber = (fn: (ranges: MextTokenRange[]) => void): () => void => () => {
		if (!this.isEditable) {
			return;
		}

		const { tokens } = this.state.getModel();
		const selection = this.carriage.getSelection();
		if (selection === null) {
			return;
		}

		const ranges = this.getSelectedTokens(tokens, selection);

		fn(ranges);
	};
}

export default Mext;
