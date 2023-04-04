enum CharCode {
	// Formatting
	/** * */
	Asterisk = 42,
	/** _ */
	Underscore = 95,
	/** ` */
	BackTick = 96,
	/** ~ */
	Tilde = 126,

	// Punctuation
	/** ! */
	Exclamation = 33,
	/** "" */
	DoubleQuote = 34,
	/** ' */
	SingleQuote = 39,
	/** , */
	Comma = 44,
	/** . */
	Dot = 46,
	/**  = */
	Colon = 58,
	/** ; */
	SemiColon = 59,
	/** ? */
	Question = 63,
	/** ( */
	RoundBracketOpen = 40,
	/** ) */
	RoundBracketClose = 41,
	/** [ */
	SquareBracketOpen = 91,
	/** ] */
	SquareBracketClose = 93,
	/** { */
	CurlyBracketOpen = 123,
	/** } */
	CurlyBracketClose = 125,
	/** `<` */
	LeftAngle = 60,
	/** `>` */
	RightAngle = 62,
	/** - */
	Hyphen = 45,
	/** &ndash; */
	EnDash = 0x02013,
	/** &mdash; */
	EmDash = 0x02014,

	// Whitespace
	Tab = 9, // \t
	Space = 32, //
	NBSP = 160, // &nbsp;

	// New line
	/** `\n` */
	NewLine = 10, // \n
	/** `\r` */
	Return = 13,
	/** `\f` */
	LineFeed = 12,

	// Special
	/** = */
	Equal = 61,
	/** / */
	Slash = 47,
	/** \ */
	BackSlash = 92,
	/** | */
	Pipe = 124,
	/** ^ */
	Caret = 94,
	/** % */
	Percent = 37,
	/** & */
	Ampersand = 38,
	/** + */
	Plus = 43,
	/** @ */
	At = 64,
	/** # */
	Hash = 35,
}

export default CharCode;
