class L0Builder {
    data = {};
    const = {};
    labels = {};
    statements = [];
    ECS = new ECS();

    handle(node) {
        if (["source_file", "declarations","statements"].includes(node.type)) { 
            for (var i = 0; i < node.childCount; i++){
                this.handle(node.child(i));
            }
        }

        else if (node.type === "comment") {
            return;
        }

        else if (["statement", "declaration"].includes(node.type)) { 
            this.handle(node.child(0));
        }

        else if (["expression", "memory_expression"].includes(node.type)) {
            switch (node.childCount) {
                case 1:
                    return new Expression(CONTENT_TYPES.EXPRESSION, this.handle(node.child(0)));
                case 2:
                    return new Expression(CONTENT_TYPES.UN_EXPRESSION, this.handle(node.child(1)), node.child(0).text);
                case 3:
                    var left_reader = this.handle(get_left_child(node));
                    var right_reader = this.handle(get_right_child(node));
                    if (left_reader.type === CONTENT_TYPES.MEMORY && right_reader.type === CONTENT_TYPES.MEMORY) {
                        this.assign(node, false, new Content(CONTENT_TYPES.REGISTER, '$x'), left_reader);
                        this.assign(node, false, new Content(CONTENT_TYPES.REGISTER, '$y'), right_reader);
                        left_reader = new Content(CONTENT_TYPES.REGISTER, '$x');
                        right_reader = new Content(CONTENT_TYPES.REGISTER, '$y');
                    } 
                    return new Expression(CONTENT_TYPES.BIN_EXPRESSION, left_reader, get_operator(node).text,  right_reader);
            }
        }

        else if (node.type === "number") {
            return new Content(CONTENT_TYPES.NUMBER, parseInt(node.text));
        }

        else if (node.type === "constant") {
            return new Content(CONTENT_TYPES.CONSTANT, node.text);
        }

        else if (node.type === "data") {
            return new Content(CONTENT_TYPES.DATA, node.text);
        }

        else if (["memory_reader" ,"reader", "writer"].includes(node.type)) {
            return this.handle(node.child(0));
        }

        else if (node.type === "register") {
            return new Content(CONTENT_TYPES.REGISTER, node.text);
        }

        else if (node.type === "memory") {
            return new Content(CONTENT_TYPES.MEMORY, this.handle(node.child(1)), get_datatype(node.child(3).text));
        }

        else if (node.type === "assignment") {
            var is_conditional = node.child(1).text === "?=" ? true : false;
            var writer = this.handle(node.child(0));
            var expression = this.handle(node.child(2));
            this.assign(node, is_conditional, writer, expression);
        }
        
        else if(node.type === "constant_declaration"){
            let id = node.child(1).text;
            let value = node.child(2).text;
            this.const[id] = value;
        }
        
        else if(node.type === "data_declaration"){
            let id = node.child(1).text;
            let value = node.child(2).text;
            this.data[id] = value;
        }
        
        else if(node.type === "label"){
            this.labels[node.text] = this.statements.length;
        }
        
        else if(node.type === "syscall"){
            this.push_statement(node, new ByteCode(OP.SYSCALL));
        }
    }

    assign(node, is_conditional, writer, expression) {
        this.push_statement(node, new ByteCode(get_opcode(expression), [is_conditional, writer].concat(convert_content_to_array(expression))));
    }

    push_statement(node, byte_code) {
        this.statements.push(byte_code);
        this.ECS.nodes.push(node);
    }
}