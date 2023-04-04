import MextToken from '../tokens/MextToken';

interface MextTokenRange {
	token: MextToken,
	start: number,
	end: number,
	isFull: boolean,
}

export default MextTokenRange;
