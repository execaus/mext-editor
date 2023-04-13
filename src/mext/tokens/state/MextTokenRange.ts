import MextToken from '../MextToken';

interface MextTokenRange {
	token: MextToken,
	start: number,
	end: number,
	isFull: boolean,
}

export default MextTokenRange;
