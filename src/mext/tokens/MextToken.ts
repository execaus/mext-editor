import MextTokenType from './MextTokenType';
import FontSize from '../types/FontSize';

interface MextToken {
	type: MextTokenType,
	content: number[],
	color: string,
	format: number,
	fontSize: FontSize,
	fontFamily: string,
}

export default MextToken;
