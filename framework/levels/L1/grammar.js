module.exports = grammar({
	name: 'L1',
	
	rules: {
		source_file: $ => seq(optional($.declarations), $.statements),

		declarations: $ =>
			repeat1(
				seq($.declaration,
					';',
					'\n',
				)
			),
				
		declaration: $ =>
			choice(
				$.constant_declaration,
				$.data_declaration
			),
		
		constant_declaration: $ =>
			seq('const', $.constant, $.number),

		data_declaration: $ =>
			seq('data', $.data, $.string),

		statements: $ => 
			repeat1(
				seq(
					optional($.label),
					$.statement, 
					';', 
					optional($.comment),
					optional('\n')
				)
			),

		statement: $ =>
			choice(
				$.syscall,
				$.assignment,
				$.goto,
			),

		assignment: $ =>
			seq($.writer, choice(':=',"?="), optional('!'), $.expression),

		goto: $ =>
			seq("goto", choice($.register, $.label)),

		expression: $ =>
			choice(
				seq($.reader, $.operator, $.reader),
				seq($.operator, $.reader),
				$.reader
			),
				
		reader: $ =>
			choice(
				$.register,
				$.memory,
				$.number,
				$.label,
				$.constant,
				$.data
			),

		writer: $ =>
			choice(
				$.register,
				$.memory
			),

		memory_expression: $ =>
			choice(
				seq($.memory_reader, $.operator, $.memory_reader),
			),

		memory_reader: $ => 
			choice(
				$.register,
				$.number,
				$.constant,
				$.data
			),

		memory: $ => seq('[', choice($.memory_expression, $.memory_reader), ',', $.type, ']'),
		
		type: () => /i8|i16|i32|i64|u8|u16|u32|u64|f8|f16|f32|f64/,

		constant: () => /@[_a-zA-Z]+/,

		data: () => /&[_a-zA-Z]+/,

		label: () => /#[A-Z]+/,

		register: () => /\$[x,y,i,j,k,l,m,n,?,!]/,

		syscall: () => 'syscall',

		operator: () => /[+-/\*|&><=]+/,

		number: () => /[0-9]+/,

		string: () => /".+"/,

		comment: () => /\/\/[a-zA-Z0-9 ]+/
	}
});