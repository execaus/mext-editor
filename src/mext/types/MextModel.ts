import MextToken from '../tokens/MextToken';
import TextAlign from './TextAlign';

interface MextModel {
	id: string,
	tokens: MextToken[],
	align: TextAlign,
	lineHeight: number,
}

export default MextModel;
