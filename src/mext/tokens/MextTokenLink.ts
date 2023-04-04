import MextTokenType from './MextTokenType';
import MextToken from './MextToken';

interface MextTokenLink extends MextToken {
	type: MextTokenType.Link,
	url: string,
}

export default MextTokenLink;
