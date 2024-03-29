module.exports = grammar({
	name: 'L4',
	
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
					choice(
						seq(
							$.statement, 
							';', 
						),
						$.statement_block
					),
					optional($.comment),
					optional('\n')
				)
			),

		statement: $ =>
			choice(
				$.syscall,
				$.assignment,
				$.goto,
				$.variable,
			),

		statement_block: $ =>
			choice(
				$.scope,
				$.if,
				$.while,
				$.for
			),

		while: $ => 
			seq(
				'while', '(', $.expression, ')', $.scope
			),

		for: $ => 
			seq( 
				'for', '(', $.variable, ';', $.expression, ';', $.expression, ')', $.scope
			),

		if: $ => 
			seq(
				'if', '(', $.expression, ')', $.scope, optional($.else)
			),

		else: $ =>
			seq(
				'else', $.scope
			),
			
		scope: $ =>
			seq('{',
				$.statements
			,'}'),

		assignment: $ =>
			seq($.writer, choice(':=',"?="), optional('!'), $.expression),

		goto: $ =>
			seq("goto", choice($.register, $.label)),

		variable: $ =>
			seq($.variable_name, ":", $.type, "=", optional('!'), $.expression),

		expression: $ =>
			choice(
				prec.left(2, seq('(', $.expression, ')', $.logical_operator, '(', $.expression, ')')),
				prec.left(2, seq('(', $.expression, ')', '*', '(', $.expression, ')')),
				prec.left(2, seq('(', $.expression, ')', '/', '(', $.expression, ')')),
				prec.left(1, seq('(', $.expression, ')', '+', '(', $.expression, ')')),
				prec.left(1, seq('(', $.expression, ')', '-', '(', $.expression, ')')),

				prec.left(2, seq('(', $.expression, ')', $.logical_operator, $.reader)),
				prec.left(2, seq('(', $.expression, ')', '*', $.reader)),
				prec.left(2, seq('(', $.expression, ')', '/', $.reader)),
				prec.left(1, seq('(', $.expression, ')', '+', $.reader)),
				prec.left(1, seq('(', $.expression, ')', '-', $.reader)),

				prec.left(2, seq($.reader, $.logical_operator, '(', $.expression, ')')),
				prec.left(2, seq($.reader, '*', '(', $.expression, ')')),
				prec.left(2, seq($.reader, '/', '(', $.expression, ')')),
				prec.left(1, seq($.reader, '+', '(', $.expression, ')')),
				prec.left(1, seq($.reader, '-', '(', $.expression, ')')),

				prec.left(2, seq($.reader, $.logical_operator, $.reader)),
				prec.left(2, seq($.reader, '*', $.reader)),
				prec.left(2, seq($.reader, '/', $.reader)),
				prec.left(1, seq($.reader, '+', $.reader)),
				prec.left(1, seq($.reader, '-', $.reader)),
				seq('-', $.reader),
				$.reader,
			),
				
		reader: $ =>
			choice(
				$.register,
				$.memory,
				$.number,
				$.variable_name,
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

		operator: () => /[+-/\*]/,

		logical_operator: () => /\||&|<|>|>=|<=|==/,

		number: () => /[0-9]+/,

		string: () => /".+"/,

		variable_name: () => /[_a-zA-Z]+/,

		comment: () => /\/\/[a-zA-Z0-9 ]+/
	}
});