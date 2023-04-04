import MextToken from './MextToken';
import MextTokenType from './MextTokenType';

interface MextTokenString extends MextToken {
	type: MextTokenType.String,
	color: string,
}

export default MextTokenString;
