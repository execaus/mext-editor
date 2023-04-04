import MextToken from '../tokens/MextToken';

interface ResultSplitTokens {
	// Обновленная последовательность токенов
	updatedSequence: MextToken[];
	// Токены, у которых нужно будет обновить форматирование
	crossedTokens: MextToken[];
}

export default ResultSplitTokens;
