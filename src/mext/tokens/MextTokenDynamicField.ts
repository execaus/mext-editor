import MextToken from './MextToken';
import MextTokenType from './MextTokenType';

interface MextTokenDynamicField extends MextToken {
	type: MextTokenType.DynamicField,
	value: string,
}

export default MextTokenDynamicField;
