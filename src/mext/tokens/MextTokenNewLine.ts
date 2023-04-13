import MextTokenType from './MextTokenType';
import MextToken from './MextToken';

interface MextTokenNewLine extends MextToken {
	type: MextTokenType.NewLine
}

export default MextTokenNewLine;
