import MextToken from '../tokens/MextToken';

interface MextCarriageTokenPosition {
	token: MextToken,
	leftBound: boolean,
	rightBound: boolean,
	position: number,
}

export default MextCarriageTokenPosition;
