import MextModel from './types/MextModel';
import MextRenderEngine from './MextRenderEngine';
import TextAlign from './types/TextAlign';
import MextToken from './tokens/MextToken';
import MextTokenType from './tokens/MextTokenType';

class MextState {
	private readonly renderEngine: MextRenderEngine;
	private readonly subscribers: (() => void)[];

	private model: MextModel;

	constructor(renderEngine: MextRenderEngine) {
		this.model = {
			tokens: [],
			align: TextAlign.LEFT,
			lineHeight: 1.26,
			id: '',
		};
		this.subscribers = [];
		this.renderEngine = renderEngine;
	}

	public updateAndRender = (fn: (_: MextModel) => MextModel) => {
		const updatedModel = fn(this.model);
		updatedModel.tokens = this.mergeTokens(updatedModel.tokens);

		this.renderEngine.render(updatedModel);
		this.model = updatedModel;

		this.reportSubscribers();
		this.printContent();
	};

	public subscribeChange = (subscriber: () => void) => {
		this.subscribers.push(subscriber);
	};

	public getModel = (): MextModel => ({
		...this.model,
		tokens: [...this.model.tokens],
	});

	private reportSubscribers = () => {
		this.subscribers.forEach(subscriber => subscriber());
	};

	/** Объединяет одинаковые текстовые токены друг с другом */
	private mergeTokens = (tokens: MextToken[]): MextToken[] => {
		let result: MextToken[] = [...tokens];

		let tokenCount = result.length - 1;
		for (let i = 0; i < tokenCount; i++) {
			const currentToken = result[i];
			const nextToken = result[i + 1];

			if (currentToken.type === MextTokenType.String && nextToken.type === MextTokenType.String) {
				const isTokensEqual = this.equalTokens(currentToken, nextToken);
				if (isTokensEqual) {
					currentToken.content = [
						...currentToken.content,
						...nextToken.content,
					];
					result = [
						...result.slice(0, i + 1),
						...result.slice(i + 2),
					];

					i--;
					tokenCount -= 1;
				}
			}
		}

		return result;
	};

	private equalTokens = (a: MextToken, b: MextToken): boolean => a.format === b.format
			&& a.color === b.color
			&& a.fontSize === b.fontSize
			&& a.fontFamily === b.fontFamily;

	private printContent = () => {
		console.log(String.fromCodePoint(...this.model.tokens.map(t => t.content).flat()));
	};
}

export default MextState;
