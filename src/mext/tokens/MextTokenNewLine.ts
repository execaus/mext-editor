import MextBaseToken from './MextToken';
import MextTokenType from './MextTokenType';

interface MextTokenNewLine extends MextBaseToken {
	type: MextTokenType.NewLine
}

export default MextTokenNewLine;
