function asciiToBinary(str) {
    return atob(str)
}

function decode(encoded) {
    var binaryString =  asciiToBinary(encoded);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

var encoded_levels = new Array();
class L0Visitor {

    visit(node) {
        if (node.type === "statement") this._emitter.node_stack.push(node);
        if (this[node.type] === undefined) {
            var r = this.default(node);
            return r;
        } else {
            var r = this[node.type](node);
            return r;
        }
    }

    default(node) {
        if (node.childCount == 1) {
            return this.visit(node.child(0));
        } else {
            node.children.forEach(c => { this.visit(c) });
        }
    }

    comment(node) {
        return;
    }

    expression(node) {
        switch (node.childCount) {
            case 1:
                var reader = this.visit(node.child(0));
                return this._emitter.expression(reader)
            case 2:
                var oper = node.child(0).text;
                var reader =  this.visit(node.child(1));
                return this._emitter.unary_expression(oper, reader)
            case 3:
                var left_reader = this.visit(get_left_child(node));
                var oper = get_operator(node).text;
                var right_reader = this.visit(get_right_child(node));
                return this._emitter.binary_expression(left_reader, oper, right_reader);
        }
    }

    memory_expression(node) {
        return this.expression(node);
    }

    number(node) {
        var number = parseInt(node.text);
        return this._emitter.number(number);
    }

    constant(node) {
        var constant_id = node.text;
        return this._emitter.constant(constant_id);
    }

    data(node) {
        var data_id = node.text;
        return this._emitter.data(data_id);
    }

    register(node) {
        var register_id = node.text;
        return this._emitter.register(register_id);
    }

    memory(node) {
        var memory_id = this.visit(node.child(1));
        var datatype = get_datatype(node.child(3).text);
        return this._emitter.memory(memory_id, datatype);
    }

    assignment(node) {
        var is_conditional = node.child(1).text === "?=" ? true : false;
        var writer = this.visit(node.child(0));
        var expression = this.visit(node.child(2));
        this._emitter.assignment(is_conditional, writer, expression);
    }

    constant_declaration(node) {
        let constant_id = node.child(1).text;
        let value = node.child(2).text;
        this._emitter.constant_declaration(constant_id,value);
    }

    data_declaration(node) {
        let data_id = node.child(1).text;
        let value = node.child(2).text;
        this._emitter.data_declaration(data_id,value);
    }   

    label(node) {
        var label_id = node.text;
        if(node.parent.type === 'statements'){
            this._emitter.set_label(label_id);
        }else{
            return this._emitter.get_label(label_id);
        }
    }

    syscall(node) {
        this._emitter.syscall();
    }
}

class L0Emitter {
    _data = {};
    _const = {};
    _labels = {};
    _statements = [];
    _ECS = new ECS();
    _static_draws = {};

    constructor() {
        this._static_draws.L0 = L0Draw;
    }

    expression(reader){
        return new Expression(CONTENT_TYPES.EXPRESSION, reader);
    }

    unary_expression(oper, reader){
        return new Expression(CONTENT_TYPES.UN_EXPRESSION, reader, oper);
    }

    binary_expression(left_reader, oper, right_reader){
        if (left_reader.type === CONTENT_TYPES.MEMORY && right_reader.type === CONTENT_TYPES.MEMORY) {
            this.assignment(false, this.register('$x'), left_reader);
            this.assignment(false, this.register('$y'), right_reader);
            left_reader = this.register('$x');
            right_reader = this.register('$y');
        }

        return new Expression(CONTENT_TYPES.BIN_EXPRESSION, left_reader, oper,  right_reader);
    }

    number(number) {
        return new Content(CONTENT_TYPES.NUMBER, number);
    }

    constant(constant_id) {
        return new Content(CONTENT_TYPES.CONSTANT, constant_id);
    }

    data(data_id) {
        return new Content(CONTENT_TYPES.DATA, data_id);
    }

    register(register_id) {;
        return new Content(CONTENT_TYPES.REGISTER, register_id);
    }

    memory(memory_id, datatype) {
        return new Content(CONTENT_TYPES.MEMORY, memory_id, datatype);
    }

    constant_declaration(constant_id, constant_value) {
        this._const[constant_id] = constant_value;
    }

    data_declaration(data_id, data_value) {
        this._data[data_id] = data_value;
    }   

    set_label(label_id) {
        this._labels[label_id] = this._statements.length;
    }

    get_label(label_id) {
        return new Content(CONTENT_TYPES.LABEL, label_id);
    }

    syscall() {
        this.push_statement(new ByteCode(OP.SYSCALL));
    }


    assignment(is_conditional, writer, expression, drawfun = null, drawparams = null) {
        this.push_statement(new ByteCode(get_opcode(expression), [is_conditional, writer].concat(convert_content_to_array(expression))), drawfun, drawparams);
    }

    push_statement(byte_code, drawfun, drawparams) {
        this._statements.push(byte_code);
        this._ECS.nodes.push(this.node_stack.peek());
        this._ECS.draws.push(drawfun);
        this._ECS.drawparams.push(drawparams);
    }

    node_stack = {
        stack: [],
    
        push(node) {
            this.stack.push(node);
        },
    
        pop() {
            if (this.stack.length == 0)
                return "Underflow";
            return this.stack.pop();
        },
    
        peek(){
            return this.stack[this.stack.length-1];
        }
    };
}

const L0Draw = {
    program: null,
    state: null,

    draw(vm) {
        this.program = vm.program;
        this.state = vm.state;
        if(this.program.error_msg !== null){
          return this.program.error_msg;
        }
        var pretty_source_code = "";
        var instructions = this.program.instructions;
        var debugging = document.querySelector('#debugbutton').disabled;
        for (var i = 0; i < instructions.length; i++) {
          var one_indexed = i;
          var res = `<span id=line-number>${one_indexed} </span>` + instructions[i].handle(this) + this.print_label(i) +`<br>`;
          if (!debugging || this.state === undefined) {
            pretty_source_code += res;
          } else {
            if (one_indexed === this.state.registers['$!']) {
              pretty_source_code +=
                  `<span class=highlight-line>${res}</span>`
            } else {
              pretty_source_code += res
            }
          }
        }
        document.getElementById("prettyPretty").innerHTML = pretty_source_code;
      },
    
      syscall() { return `<span style='color: red'>syscall;</span>\n` },
    
      assign_binary(conditional, writer, reader1, opr, reader2) {
        var cond = conditional ? '?=' : ':=';
        return `${this.wrap_assign(this.print_content(writer))} ${this.wrap_opr(cond)} ${this.wrap_assign(this.print_content(reader1))} ${this.wrap_opr(opr)} ${this.wrap_assign(this.print_content(reader2))}${this.wrap_semicolon()}\n`
      },
    
      assign_unary(conditional, writer, opr, reader) {
        var cond = conditional ? '?=' : ':=';
        return `${this.wrap_assign(this.print_content(writer))} ${this.wrap_opr(cond)} ${this.wrap_opr(opr)} ${this.wrap_assign(this.print_content(reader))}${this.wrap_semicolon()}\n`
      },
    
      assign(conditional, writer, reader) {
        var cond = conditional ? '?=' : ':=';
        return `${this.wrap_assign(this.print_content(writer))} ${this.wrap_opr(cond)} ${this.wrap_assign(this.print_content(reader))}${this.wrap_semicolon()}\n`
      },
    
      wrap_assign(assign) {
        return `<span id=assign>${assign}</span>`;
      },
    
      wrap_opr(opr) {
        return `<span id=opr>${opr}</span>`;
      },
    
      wrap_semicolon() {
        return `<span id=semicolon>;</span>`;
      },
    
      wrap_const(constant) {
        return `<span id=constant>${constant}</span>`;
      },
    
      wrap_label(label) {
        return `<span id=label>${label}</span>`;
      },
    
      print_content(content){
        if (content.type === CONTENT_TYPES.CONSTANT){
          return `${this.wrap_const(`${content.id} (${this.program.constants[content.id]})`)}`
        }else if(content.type == CONTENT_TYPES.MEMORY){
          return this.print_memory(content);
        }else{
          return `${content.id}`
        }
      },
    
      print_memory(content) {
        if (content.id.type === CONTENT_TYPES.BIN_EXPRESSION) {
          return `[${content.id.reader1.get_text()} ${content.id.opr} ${content.id.reader2.get_text()},${content.datatype.type}${content.datatype.size}]`
        }
        else {
          return `[${content.get_text()},${content.datatype.type}${content.datatype.size}]`
        }
      },
    
      print_label(i){
        var [exists, label_key] = getKeyByValueIfValueExists(this.program.labels, i);
        var result = exists ? `${this.wrap_label(label_key)}` : "";
        return result;
      },

      
    
}
encoded_levels.push(decode('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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMABQAAAAAABwAAAAAAAAAAAAAACQALAA0AAAAAAAAAAAAuAAcALAArACsAHAAoAC8AAAAAABYAAAAAABoABAADAAAAAAAAAAAAAQAAAAAAAAADAAAAAAAAAAEBAAAAAAAAAAAgAAAAAAABAQAAAAAAAAAAMAAAAAAAAQEAAAAAAAAAAA4AAAAAAAEBAAAAAAAAAAAKAAAAAAABAQAAAAAAAAAAGgAAAAAAAQEAAAAAAAAAAC8AAAAAAAEBAAAAAAAAAAAXAAAAAAABAAAAAAAAAAAACAAAAAAAAQEAAAAAAAABARkAAAAAAAEBAAAAAAAAAQEVAAAAAAABAQAAAAAAAAECIwAAAAAAAgEAAAAAAAABAiMAAAAAAAAADgAAAQAAAgEAAAAAAAABAiMAAAAAAAAACgAAAQAAAgEAAAAAAAABAiMAAAAAAAAAGgAAAQAAAgEAAAAAAAABAiMAAAAAAAAALwAAAQAAAgEAAAAAAAABAiIAAAAAAAAAIAAAAQAAAgEAAAAAAAABAiIAAAAAAAAAMAAAAQAAAQEAAAAAAAABAiIAAAAAAAEBAAAAAAAAAAATAAAAAAABAAAAAAAAAAECIwAAAAAAAQAAAAAAAAAAAA8AAAAAAAEBAAAAAAAAAQMjAAAAAAABAQAAAAAAAAAAEQAAAAAAAQAAAAAAAAABAyMAAAAAAAEAAAAAAAAAAAANAAAAAAABAQAAAAAAAAEEIwAAAAAAAQEAAAAAAAAAABIAAAAAAAEAAAAAAAAAAQQjAAAAAAABAQAAAAAAAAAAGQAAAAAAAQEAAAAAAAABAyIAAAAAAAEBAAAAAAAAAQUjAAAAAAABAQAAAAAAAAEFIQAAAAAAAQEAAAAAAAAAAAIAAAAAAAEBAAAAAAAAAQEdAAAAAAABAAAAAAAAAAAAHwAAAAAAAQAAAAAAAAAAABQAAAAAAAEAAAAAAAAAAQEgAAAAAAABAQAAAAAAAAEBHgAAAAAAAQEAAAAAAAABARwAAAAAAAEBAAAAAAAAAAAJAAAAAAABAQAAAAAAAAEBFAAAAAAAAQEAAAAAAAABAxcAAAAAAAEBAAAAAAAAAQMYAAAAAAABAQAAAAAAAAAAKQAAAAAAAQEAAAAAAAAAACYAAAAAAAEBAAAAAAAAAAAQAAAAAAABAQAAAAAAAAECFAAAAAAAAQEAAAAAAAAAAAwAAAAAAAEBAAAAAAAAAAAfAAAAAAABAQAAAAAAAAAAHgAAAAAAAQEAAAAAAAAAAB0AAAAAAAEBAAAAAAAAAQMbAAAAAAABAQAAAAAAAAAACwAAAAAAAQEAAAAAAAAAABUAAAAAAAEBAAAAAAAAAQMfAAAAAAABAQAAAAAAAAEBFgAAAAAAAQEAAAAAAAAAACEAAAAAAAEBAAAAAAAAAQIcAAAAAAABAQAAAAAAAAIAAAAAAAAAAQEAAAAAAAABARoAAAAAAAEBAAAAAAAAAAAlAAAAAAABAQAAAAAAAAEDHAAAAAAAbWVtb3J5AGNvbnN0AGFzc2lnbm1lbnQAY29tbWVudABzdGF0ZW1lbnQAY29uc3RhbnQAc3RhdGVtZW50cwBkZWNsYXJhdGlvbnMAb3BlcmF0b3IAcmVnaXN0ZXIAd3JpdGVyAG1lbW9yeV9yZWFkZXIAbnVtYmVyAGNvbnN0YW50X2RlY2xhcmF0aW9uAGRhdGFfZGVjbGFyYXRpb24AbWVtb3J5X2V4cHJlc3Npb24Ac3lzY2FsbABsYWJlbABzdHJpbmcAdHlwZQBzb3VyY2VfZmlsZQBlbmQAZGF0YQBdAFsAPz0AOj0AOwBzdGF0ZW1lbnRzX3JlcGVhdDEAZGVjbGFyYXRpb25zX3JlcGVhdDEALAAKAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAABwAAAAcAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANAAAAJAAAAAAAAAAUAAAAAAAAADIAAAACAAAAAQAAAAAAAAAFAAAAMAUAAAAAAACgAwAAwAUAAGAMAAAAAAAAAAAAAAAAAABgBAAA0AQAABgFAAAaBQAAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC/CgAA0goAAP4KAADvCQAAwwoAAM8KAADMCgAAygoAAPwKAADICgAArgoAABIKAADDCgAAoQoAADwKAACZCgAAMwoAAFoKAACnCgAAAAoAALMKAAAmCgAAewoAAGEKAAB2CgAAGwoAAAgKAAD1CQAAjgoAAFMKAABFCgAAhwoAAEwKAADoCQAA5woAANQKAAA='));
class L1Visitor extends L0Visitor {  
    goto(node) {
        var reader = node.child(1);
        var pos = this.visit(reader);
        this._emitter.goto(pos)
    }
}

class L1Emitter extends L0Emitter{
    goto(pos){
        this.assignment(
            true, 
            this.register('$!'), 
            this.binary_expression(pos, '-', this.number(1)));
    }
}
encoded_levels.push(decode('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ABIACAAHAAEABwAJAAEACAANAAEADwAPAAEAEAAWAAEAIwAbAAEAIAAkAAEAGwAxAAIAHAAdAAQAEwABAAAAMgABAAIANgABABQANAAFAAcACAAOAA8AEAAEAAkAAQAIABkAAQAjADMAAQAfAC4ABQAMAA0ADgAPABIABAAJAAEACAAZAAEAIwAvAAEAHwAuAAUADAANAA4ADwASAAQAOAABAAAAOgABAAIAPgABABQAPAAFAAcACAAOAA8AEAADAEAAAQAAAEIAAQACAEQABQAHAAgADgAPABAAAwA4AAEAAAA6AAEAAgA8AAUABwAIAA4ADwAQAAEARgAHAAMABAAHAAgADgAPABAAAQBIAAYAAAAHAAgADgAPABAAAQBAAAYAAAAHAAgADgAPABAAAwAXAAEAIgAlAAEAIQBKAAQADAANAA8AEgABADgABgAAAAcACAAOAA8AEAACACwAAQAiAEoABAAMAA0ADwASAAEATAAEAAEABQAGABEAAQBOAAIABQAGAAIAUAABAAkAUgABABEAAQBUAAIACQARAAEAVgACAAEAEQABAFgAAgAOAA8AAQBaAAIABQAGAAIAXAABAAEAXgABABEAAQBgAAEAAAABAGIAAQACAAEAZAABAAEAAQBmAAEAAQABAGgAAQALAAEAagABAAwAAQBsAAEAAAABAG4AAQABAAEAcAABAAkAAQByAAEAAQABAHQAAQATAAEAdgABABIAAQB4AAEAAQABAHoAAQABAAEAfAABAAoAAQB+AAEACQABAIAAAQABAAEAggABAAEAAQCEAAEAAQABAIYAAQAAAAEAiAABAAEAAQCKAAEADQABAIwAAQABAAAAAAAjAAAARgAAAGkAAACBAAAAmQAAALAAAADKAAAA2wAAAOwAAAD9AAAADgEAABwBAAAqAQAANAEAAD0BAABGAQAAUwEAAFwBAABmAQAAbQEAAHIBAAB5AQAAfgEAAIMBAACIAQAAjQEAAJQBAACYAQAAnAEAAKABAACkAQAAqAEAAKwBAACwAQAAtAEAALgBAAC8AQAAwAEAAMQBAADIAQAAzAEAANABAADUAQAA2AEAANwBAADgAQAA5AEAAOgBAADsAQAAAAAAAAAAAAAAAQABAAABAAABAAABAAABAAABAAABAAABAAABAAABAAABAQABAQABAQABAQABAQAB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'));
class L2Visitor extends L1Visitor {
    scope(node) {
        this._emitter.start_scope();
        this.visit(node.child(1));
        this._emitter.end_scope();
    }

    variable(node)  {
        var var_name = node.child(0).text;
        var var_size = node.child(2).text;
        var expression = this.visit(node.child(4));
        return this._emitter.variable(var_name, var_size, expression);
    }

    variable_name(node) {
        var var_name = node.text;

        return this._emitter.variable_name(var_name);
    }
}

class L2Emitter extends L1Emitter{
    variables = {}
    head = null
    stack_pointer = 112;
    frame_pointer = 112;
    in_scope = false;

    constructor() {
        super();
        this._static_draws.L2 = L2Draw;
    }

    variable(var_name, var_size, expression) {
        if (this.in_scope) {
            this.create_temp_var(var_name, var_size, expression);
        } else {
            this.variable_declaration(var_name, var_size, expression)
        }
    }

    variable_name(var_name) {
        if (this.in_scope) {
            return this.read_temp_var(var_name);
        } else {
            var p_var = '&_' + var_name;
            return this.memory(this.data(p_var), get_datatype(this.variables[p_var]));
        }
    }

    create_temp_var(var_name, var_size, expression) {
        var variable_size = get_variable_bytesize(var_size);
        this.frame_pointer -= variable_size;
        this.head.variables[var_name] = [this.stack_pointer - this.frame_pointer, var_size];
        var writer = this.read_temp_var(var_name);
        const snapshot = [structuredClone(this.variables), structuredClone(this.head)];
        this.assignment(false, writer, expression,L2Draw, snapshot);
    }

    read_temp_var(var_name) {
        var current = this.head;
        while (current != null) {
            if (var_name in current.variables) {
                return this.memory(this.binary_expression(this.register('$fp'), '-', this.number(current.variables[var_name][0])), get_datatype(current.variables[var_name][1]))
            }   
            current = current.next;
        }
        // TODO: check if node.text is in variable dict otherwise return error
        var p_var = '&_' + var_name;
        return this.memory(this.data(p_var), get_datatype(this.variables[p_var]));
    }

    start_scope() {
        var frame = new StackFrame();
        frame.next = this.head;
        this.head = frame;
        this.in_scope = true;

        this.Stack.push(this.frame_pointer);
    }

    end_scope() {
        var offset = this.Stack.pop() - this.frame_pointer;
        this.head = this.head.next;
        this.frame_pointer += offset;
        if (this.head === null) {
            this.in_scope = false;
        }
    }

    variable_declaration(var_name, var_size, expression) {
        var p_var = '&_' + var_name;
        this.variables[p_var] = var_size;
        var memory_allocation = "";

        for (var i = 0; i < get_variable_bytesize(var_size); i++) {
            memory_allocation += "0";
        }
        this._data[p_var] = memory_allocation;
        const snapshot = [structuredClone(this.variables), null];
        this.assignment(
            false, 
            this.memory(this.data(p_var), get_datatype(var_size)), 
            expression,
            L2Draw,
            snapshot);
    }

    Stack = {
        items: [],
    
        push(element)
        {
            this.items.push(element);
        },
    
        pop()
        {
            if (this.items.length == 0)
                return "Underflow";
            return this.items.pop();
        }
    }
}


class StackFrame {
    next;
    variables;
    constructor() {
        this.next= null;
        this.variables = {};
    }
}

const L2Draw = {

    params: [],

    draw(params, vm) {
        var container = document.getElementById("lx-container");

        var existingContainer = document.getElementById("table-wrapper-container");
        if (existingContainer) {
          container.removeChild(existingContainer);
        }

        var wrapperContainer = document.createElement("div");
        wrapperContainer.id = "table-wrapper-container";

        var variables = params[0];
        this.create_wrapper(variables, vm, wrapperContainer)
        var stack_head = params[1];
        while (stack_head != null) {
            this.create_wrapper(stack_head.variables, vm, wrapperContainer)
            stack_head = stack_head.next;
        }
        
        container.appendChild(wrapperContainer)

    },

    create_wrapper(variables, vm, container){
        var table = this.create_table_from_variables(variables, vm)
        var tableWrapper = document.createElement("L2Div");
        tableWrapper.style.display = "inline-block";
        tableWrapper.appendChild(table);
        
        tableWrapper.style.border = "1px solid black";
        tableWrapper.style.padding = "10px";
        tableWrapper.style.borderCollapse = "collapse";
        container.appendChild(tableWrapper);
    },

    create_table_from_variables(variables, vm){
        var table = document.createElement("L2Table");
        for(var name in variables){
            var row = document.createElement("tr");

            var nameCell = document.createElement("td");
            nameCell.textContent = name;
            nameCell.style.borderRight = "2px solid black";
            nameCell.style.paddingRight = "10px"
            row.appendChild(nameCell);


            var value = variables[name];
            var valueCell = document.createElement("td");
            var memory_access;
            //Check if scoped
            if(Array.isArray(value)){
                memory_access = new Content(CONTENT_TYPES.MEMORY, new Content(CONTENT_TYPES.NUMBER, 112-value[0]), get_datatype(value[1]));
            }else{
                memory_access = new Content(CONTENT_TYPES.MEMORY, new Content(CONTENT_TYPES.DATA, name), get_datatype(value));
            }
            
            valueCell.textContent = vm.read(memory_access);
            valueCell.style.paddingLeft = "10px"
            row.appendChild(valueCell);
            table.appendChild(row);
        }

        return table
    }
}
encoded_levels.push(decode('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C0ErIQMMAwtBASEEQQIhAwwCC0EtIQMMAQtBFCEDCyAAIAQgACgCCBEFAAwACwALC7shAQAjAAu0IQ0AFwABAAUAGgABAAkAHQABAAwAIAABABIAIwABABMAJgABABQAKQABABgAAgABACwAGQABACcAHAABACoAMAABACAAFQACAAAABgA4AAQAIQAiACMAJAANAAcAAQAFAAkAAQAJAAsAAQAMAA0AAQASAA8AAQATABEAAQAUABMAAQAYAAIAAQAsABkAAQAnABwAAQAqADAAAQAgACwAAgAAAAYAOAAEACEAIgAjACQADQAHAAEABQAJAAEACQALAAEADAANAAEAEgAPAAEAEwARAAEAFAATAAEAGAADAAEALAAZAAEAJwAcAAEAKgAsAAEAHwAwAAEAIAA4AAQAIQAiACMAJAANAAcAAQAFAAkAAQAJAAsAAQAMAA0AAQASAA8AAQATABEAAQAUABMAAQAYAAMAAQAsABkAAQAnABwAAQAqACIAAQAfADAAAQAgADgABAAhACIAIwAkAAcALgABAAMAMQABAAQABgABACsANAABABwAMwACAB0AHgA2AAMACQAUABgANAAEAAUADAASABMACgAHAAEABQAJAAEACQALAAEADAAPAAEAEwARAAEAFAATAAEAGAAZAAEAJwAcAAEAKgAoAAEAIAA4AAQAIQAiACMAJAAHAAMAAQADAAUAAQAEAAYAAQArADQAAQAcADMAAgAdAB4AOgADAAkAFAAYADgABAAFAAwAEgATAAQAFQABAAAAPAABAAIAQAABABkAPgAIAAUABgAJAAwAEgATABQAGAAEAEIAAQAAAEQAAQACAEgAAQAZAEYACAAFAAYACQAMABIAEwAUABgABgALAAEADABMAAEAFQAYAAEAJgAaAAEAKgAvAAEAJQBKAAYAEAARABIAEwAWABgABgALAAEADABMAAEAFQAYAAEAJgAaAAEAKgA6AAEAJQBKAAYAEAARABIAEwAWABgAAwBCAAEAAABEAAEAAgBGAAgABQAGAAkADAASABMAFAAYAAMATgABAAAAUAABAAIAUgAIAAUABgAJAAwAEgATABQAGAACAFIAAwAJABQAGABOAAYAAAAFAAYADAASABMABAALAAEADAAaAAEAKgA2AAEAJgBKAAYAEAARABIAEwAWABgAAgBWAAMA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IQAAAQAAAgAAAAAAAAABAisAAAAAAAAAOQAAAQAAAQEAAAAAAAABAisAAAAAAAEAAAAAAAAAAQIrAAAAAAABAQAAAAAAAAEBGwAAAAAAAQAAAAAAAAABARsAAAAAAAEBAAAAAAAAAAATAAAAAAABAAAAAAAAAAECLAAAAAAAAQAAAAAAAAAAAA0AAAAAAAEBAAAAAAAAAQMsAAAAAAABAQAAAAAAAAAADwAAAAAAAQAAAAAAAAABAywAAAAAAAEAAAAAAAAAAAAOAAAAAAABAQAAAAAAAAAAGgAAAAAAAQAAAAAAAAAAABAAAAAAAAEBAAAAAAAAAQQsAAAAAAABAQAAAAAAAAAAEQAAAAAAAQAAAAAAAAABBCwAAAAAAAEBAAAAAAAAAQUsAAAAAAABAAAAAAAAAAEFLAAAAAAAAQAAAAAAAAABAysAAAAAAAEBAAAAAAAAAQMrAAAAAAABAQAAAAAAAAAAGwAAAAAAAQEAAAAAAAABBSoAAAAAAAEBAAAAAAAAAQElAAAAAAABAQAAAAAAAAAAEgAAAAAAAQEAAAAAAAAAAAsAAAAAAAEBAAAAAAAAAQEmAAAAAAABAAAAAAAAAAEBKQAAAAAAAQEAAAAAAAABAScAAAAAAAEAAAAAAAAAAAAmAAAAAAABAAAAAAAAAAAAFgAAAAAAAQEAAAAAAAAAACsAAAAAAAEBAAAAAAAAAQEaAAAAAAABAQAAAAAAAAAAFAAAAAAAAQEAAAAAAAAAAC4AAAAAAAEBAAAAAAAAAQIaAAAAAAABAQAAAAAAAAEDHQAAAAAAAQEAAAAAAAABAx4AAAAAAAEBAAAAAAAAAQMhAAAAAAABAQAAAAAAAAAAMQAAAAAAAQEAAAAAAAAAACkAAAAAAAEBAAAAAAAAAAAKAAAAAAABAQAAAAAAAAAADAAAAAAAAQEAAAAAAAAAACYAAAAAAAEBAAAAAAAAAQIjAAAAAAABAQAAAAAAAAAAJQAAAAAAAQEAAAAAAAAAACQAAAAAAAEBAAAAAAAAAAAjAAAAAAABAQAAAAAAAAEDIgAAAAAAAQEAAAAAAAAAAAkAAAAAAAEBAAAAAAAAAAAXAAAAAAABAQAAAAAAAAEDKAAAAAAAAQEAAAAAAAABARwAAAAAAAEBAAAAAAAAAAAgAAAAAAABAQAAAAAAAAIAAAAAAAAAAQEAAAAAAAABAiUAAAAAAAEBAAAAAAAAAAAnAAAAAAABAQAAAAAAAAEBIAAAAAAAAQEAAAAAAAAAAC0AAAAAAAEBAAAAAAAAAQUkAAAAAAABAQAAAAAAAAEDJQAAAAAAfQB7AG1lbW9yeQBjb25zdABhc3NpZ25tZW50AGNvbW1lbnQAc3RhdGVtZW50AGNvbnN0YW50AHN0YXRlbWVudHMAZGVjbGFyYXRpb25zAG9wZXJhdG9yAHJlZ2lzdGVyAHdyaXRlcgBtZW1vcnlfcmVhZGVyAG51bWJlcgBnb3RvAGNvbnN0YW50X2RlY2xhcmF0aW9uAGRhdGFfZGVjbGFyYXRpb24AbWVtb3J5X2V4cHJlc3Npb24Ac3lzY2FsbABsYWJlbABzdHJpbmcAdHlwZQBzY29wZQB2YXJpYWJsZV9uYW1lAHNvdXJjZV9maWxlAHZhcmlhYmxlAGVuZABkYXRhAF0AWwA/PQA6PQA7ADoAc3RhdGVtZW50c19yZXBlYXQxAGRlY2xhcmF0aW9uc19yZXBlYXQxACwACgANAAAALQAAAAAAAAAaAAAAAAAAADwAAAACAAAAAQAAAAAAAAAFAAAAEAgAAAAAAAAwBQAA0AgAAAAQAAAAAAAAAAAAAAAAAAAgBgAAsAYAAAoHAAAMBwAAIAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtDwAAQA8AAG4PAAA7DgAAMQ8AADIOAAAwDgAAPQ8AADoPAACtDgAAQg8AAD4PAAA4DwAAbA8AADYPAAD/DgAAXg4AADEPAADyDgAAiA4AAOoOAAB/DgAApg4AAPgOAAAKDwAATA4AABgPAAByDgAAzA4AALIOAADHDgAAZw4AAFQOAAAEDwAAQQ4AAK0OAAAkDwAA3w4AAJ8OAACRDgAA2A4AAJgOAAA0DgAAVw8AAEQPAAA='));
class L3Visitor extends L2Visitor {
    expression(node) {
        // if the expression does not contain any sub-expressions it should be sent down to L0 instead of being handled here.
        if (!this.has_sub_expression(node)) {
            //node_stack.push(node);
            return super.expression(node);
        }
        // The algo:

        // Start scope
        // recursively handle the left child
        // If the right child is an expression, save result in a temporary variable
        // Else save in $x
        // recursively handle right side
        // If we are out of scopes it is the last expression and we save the result in $x
        // Else we return the full expression: left_expression & right_expression
        // end scope

        this._emitter.start_scope();

        var left_child = get_left_child(node);
        var right_child = get_right_child(node);

        //Handle left side
        this._emitter.node_stack.push(left_child);
        var left_expression = this.visit(left_child);
        
        var is_nested_expression = right_child.type === 'expression';
        left_expression = this._emitter.left_expression(left_expression, is_nested_expression);

        //Handle right side
        var right_expression = this.visit(right_child);
        if(this.is_binary_expression(right_child)){
            this._emitter.node_stack.push(right_child);
            this._emitter.save_to_register_x(right_expression)
        }

        //Sum both sides
        this._emitter.node_stack.push(node)
        var operator = get_operator(node).text;
        var full_expression = this._emitter.full_expression(left_expression, operator, right_expression);
        this._emitter.end_scope();

        var result = this._emitter.result(full_expression);
        if(!this._emitter.in_scope){
            this.clean_stack()
        }
        return result;
    }

    has_sub_expression(expression) {
        for (var i = 0; i < expression.childCount; i++) {
            if (expression.child(i).type === 'expression') {
                return true;
            } 
        }
        return false;
    }

    is_binary_expression(node){
        return node.childCount >= 3;
    }

    clean_stack(){
        while(this._emitter.node_stack.peek().type !== 'statement'){
            this._emitter.node_stack.pop()
        }
    }
}

class L3Emitter extends L2Emitter{
    left_expression (left_expression, is_nested_expression ){
        if (is_nested_expression) {
            var bytesize = 'u8';
            this.create_temp_var(this.frame_pointer - get_variable_bytesize(bytesize), bytesize, left_expression);
            return this.read_temp_var(`${this.frame_pointer}`);
        }
        // Else we can just write it directly into $x
        else {
            this.save_to_register_x(left_expression);
            return this.register('$x');
        }
    }

    save_to_register_x(expression){
        this.assignment(false, this.register('$x'), expression, L3Draw,[]);
    }

    full_expression(left_expression, operator, right_expression) {
        // If it is a binary assignment we have to save the right expression in a register before combining it with the left expression
        if (get_opcode(right_expression) === OP.ASSIGN_BIN) {
            return this.binary_expression(left_expression, operator, this.register('$x'));
        } else {
            return this.binary_expression(left_expression, operator, right_expression);
        }
    }

    result(full_expression){
        // If we are out of the scope we know we have handled the entire expression and we can save the final expression in $x and return $x to the caller (assignment)
        if (!this.in_scope) {
            this.save_to_register_x(full_expression);
            return this.expression(this.register('$x'));
        }else{
            return full_expression;
        }
    }
}

const L3Draw = {

    draw() {
        return;
    }
}
encoded_levels.push(decode('AGFzbQEAAAAADQZkeWxpbmvMKQQBAAABHAZgAX8AYAAAYAABf2ACf38Bf2ABfwF/YAJ/fwACWgQDZW52DV9fbWVtb3J5X2Jhc2UDfwADZW52DF9fdGFibGVfYmFzZQN/AANlbnYGbWVtb3J5AgABA2VudhlfX2luZGlyZWN0X2Z1bmN0aW9uX3RhYmxlAXAAAQMFBAEBAgMGBgF/AEEACwdQBBFfX3dhc21fY2FsbF9jdG9ycwAADnRyZWVfc2l0dGVyX0wzAAIMX19kc29faGFuZGxlAwIYX193YXNtX2FwcGx5X2RhdGFfcmVsb2NzAAEJBwEAIwELAQMKjigEBAAQAQucBwAjAEGYJ2ojAEHAE2o2AgAjAEGcJ2ojADYCACMAQaAnaiMAQeAOajYCACMAQaQnaiMAQZAVajYCACMAQagnaiMAQYAoajYCACMAQbgnaiMAQaARajYCACMAQbwnaiMAQcASajYCACMAQcAnaiMAQaYTajYCACMAQcQnaiMAQagTajYCACMAQcgnaiMAQbAkajYCACMAQcwnaiMBNgIAIwBBgChqIwBB3SNqNgIAIwBBhChqIwBB8CNqNgIAIwBBiChqIwBBqiRqNgIAIwBBjChqIwBB6yFqNgIAIwBBkChqIwBB4SNqNgIAIwBBlChqIwBB4iFqNgIAIwBBmChqIwBB4CFqNgIAIwBBnChqIwBB7SNqNgIAIwBBoChqIwBB6iNqNgIAIwBBpChqIwBB3SJqNgIAIwBBqChqIwBB8iNqNgIAIwBBrChqIwBB7iNqNgIAIwBBsChqIwBBqCRqNgIAIwBBtChqIwBBpiRqNgIAIwBBuChqIwBBpCRqNgIAIwBBvChqIwBBnCRqNgIAIwBBwChqIwBBoiRqNgIAIwBBxChqIwBBniRqNgIAIwBByChqIwBB6CNqNgIAIwBBzChqIwBBoCRqNgIAIwBB0ChqIwBB5iNqNgIAIwBB1ChqIwBBryNqNgIAIwBB2ChqIwBBjiJqNgIAIwBB3ChqIwBB4SNqNgIAIwBB4ChqIwBBoiNqNgIAIwBB5ChqIwBBuCJqNgIAIwBB6ChqIwBBmiNqNgIAIwBB7ChqIwBBryJqNgIAIwBB8ChqIwBB1iJqNgIAIwBB9ChqIwBBqCNqNgIAIwBB+ChqIwBBuiNqNgIAIwBB/ChqIwBB/CFqNgIAIwBBgClqIwBByCNqNgIAIwBBhClqIwBBoiJqNgIAIwBBiClqIwBB/CJqNgIAIwBBjClqIwBB4iJqNgIAIwBBkClqIwBB9yJqNgIAIwBBlClqIwBBlyJqNgIAIwBBmClqIwBBhCJqNgIAIwBBnClqIwBBtCNqNgIAIwBBoClqIwBB8SFqNgIAIwBBpClqIwBB3SJqNgIAIwBBqClqIwBB1CNqNgIAIwBBrClqIwBBjyNqNgIAIwBBsClqIwBBzyJqNgIAIwBBtClqIwBBwSJqNgIAIwBBuClqIwBBiCNqNgIAIwBBvClqIwBByCJqNgIAIwBBwClqIwBB5CFqNgIAIwBBxClqIwBBhyRqNgIAIwBByClqIwBB9CNqNgIACwgAIwBB8CZqC98gAQV/IAEhAwNAIAAoAgAhAkEFIQQgACAAKAIYEQQAIQZBACEBAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgA0H//wNxDkcAAQIGExQVFhcYGRobHB0eHyAiJ2NkMDEyZTM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTVFSU1RVVldYWVpbXF1eX2BhYmwLQQAhBCAGDXMCQAJAAkACQAJAAkACQCACQdoATARAQREhAwJAAkAgAkEJaw4nAAAJCQAJCQkJCQkJCQkJCQkJCQkJCQkACX4sNAkMCQ0QERI1EwMEAQtBASEEQQAhAwx9CyACQTprDgcDFAcEBxUMBwsCQCACQdsAaw4PLwcFBwcHBwcWFwcGbgcGAAsCQCACQfMAaw4DMQcGAAsgAkH7AGsOA3cGNAYLQTEhAwx6C0ElIQMMeQtBHyEDDHgLQSAhAwx3C0EqIQMMdgtBNCEDDHULIAJBMGtBCkkNckHFACEDIAJB3wBGDXQgBSEBIAJBX3FBwQBrQRpPDWsMdAtBACEEIAJBIkYEQEEzIQMMdAsgAkUgAkEKRnINaAwfC0EAIQQCQCACQR9MBEBBASACdEGAzABxRSACQQ1Lcg0BDHELQQ0hAwJAIAJBIGsODnEBAXQqAQIBAwEBAQEJAAsgAkHAAEYNAyACQdsARg0mCyACQTBrQQpJDXBBxQAhAyACQd8ARg1yIAUhASACQV9xQcEAa0EaTw1pDHILQQ4hAwxxC0EhIQMMcAtBDyEDDG8LQQAhBCACQTlMBEBBDSEDAkACQCACQSBrDhABDg5xJw4ODg4DBAUOBg4HAAtBASACdEGAzABxRSACQQ1Lcg0NC0EBIQRBAyEDDG8LIAJB4gBMBEAgAkE6aw4GBgcMDAwICwsCQCACQeMAaw4FCQoMDGEACyACQfMARg0jIAJB+wBHDQsMagtBIiEDDG0LQSMhAwxsC0EmIQMMawtBJyEDDGoLQSQhAwxpC0EJIQMMaAtBFSEDDGcLQQohAwxmC0E8IQMMZQtBNSEDDGQLIAJB2wBGDRYLQcUAIQMgAkHfAEYNYiAFIQEgAkFfcUHBAGtBGk8NWQxiCyACQS9HDVYMXAtBACEEQQghAyAFIQEgAkExaw4IYFc5V1c6V1pXCyACQTJHDVQMWAsgAkE0Rg1XDFMLIAJBNkYNVgxSCyACQT1HDVEMVAsgAkE9Rw1QQQAhBEEcIQMMWwsgAkEJayIBQRdLDVBBASEEQQEgAXRBk4CABHFFDVBBCyEDDFoLQQAhBEEvIQMgAkHpAGsiAUEQSw1NQQEgAXRBv4AGcQ1ZDE0LIAJBwQBrQRpPDU0MSwtBACEEQS0hAyACQd8ARg1XIAUhASACQV9xQcEAa0EaTw1ODFcLQQAhBEEsIQMgAkHfAEYNViAFIQEgAkFfcUHBAGtBGk8NTQxWC0EAIQRBxgAhAyACQSBGIAJBwQBrQRpJciACQTBrQQpJcg1VIAUhASACQeEAa0EaTw1MDFULIAJFIAJBCkZyDUlBACEEC0EBIQMMUwtBACEEIAYNUSACQS5MBEBBFiEDAkACQCACQQlrDgUBVQYGAQALIAJBIGsOBQAFBQIKBQtBASEEQRIhAwxTCyACQfIATARAIAJBL0YNAiACQdsARg0GIAJB5wBHDQQMRQsgAkH7AGsOA04DCwILQQ0hAwxRC0EEIQMMUAsgAkHzAEYNBAtBxQAhAyACQd8ARg1OIAUhASACQV9xQcEAa0EaTw1FDE4LQQAhBCAGDUwgAkErTARAQQ0hAwJAAkAgAkEgaw4FAQoKUAYACyACQQlrQQJJDQAgAkENRw0JC0EBIQRBEyEDDE4LIAJB5gBKDQEgAkEsRg0EIAJBOkYNBSACQdsARw0HC0EoIQMMTAsCQCACQfsAaw4DSAYFAAsgAkHnAEYNPSACQfMARw0FC0HEACEDDEoLQQwhAwxJC0EpIQMMSAtBHiEDDEcLQRohAwxGCyACQSprQQZJBEBBMSEDDEYLQcUAIQMgAkHfAEYNRSAFIQEgAkFfcUHBAGtBGk8NPAxFCyAAQQI7AQQgACAAKAIMEQAAQQEhBSACQQpHDTVBACEEQRYhAwxECyAAQQM7AQQgACAAKAIMEQAAQQAhBEEBIQVBxQAhAyACQd8ARg1DQQEhASACQV9xQcEAa0EaTw06DEMLIABBBDsBBCAAIAAoAgwRAABBACEEQQEhBUHFACEDIAJB3wBGDUJBASEBIAJBX3FBwQBrQRpPDTkMQgtBBiEEDDELQQchBAwwC0EIIQQMLwsgAEEJOwEEIAAgACgCDBEAAEEAIQRBASEFQcUAIQMgAkHfAEYNPkEBIQEgAkFfcUHBAGtBGk8NNQw+C0EKIQQMLQsgAEEKOwEEIAAgACgCDBEAAEEBIQUgAkE9Rg00DC0LQQshBAwrC0EMIQQMKgtBDSEEDCkLQQ4hBAwoC0EPIQQMJwsgAEEPOwEEIAAgACgCDBEAAEEBIQUgAkEvRg0xDCcLQRAhBAwlC0ERIQQMJAtBEiEEDCMLQRMhBAwiC0EUIQQMIQtBFSEEDCALIABBFjsBBCAAIAAoAgwRAABBACEEQQEhBUEsIQMgAkHfAEYNL0EBIQEgAkFfcUHBAGtBGk8NJgwvCyAAQRc7AQQgACAAKAIMEQAAQQAhBEEBIQVBLSEDIAJB3wBGDS5BASEBIAJBX3FBwQBrQRpPDSUMLgsgAEEYOwEEIAAgACgCDBEAAEEBIQUgAkHBAGtBGkkNIAweC0EZIQQMHAsgAEEaOwEEIAAgACgCDBEAAEEAIQRBASEFQcUAIQMgAkHfAEYNK0EBIQEgAkFfcUHBAGtBGk8NIgwrC0EbIQQMGgsgAEEcOwEEIAAgACgCDBEAAEEBIQUgAkEwa0EKTw0aQQAhBEEyIQMMKQsgAEEdOwEEIAAgACgCDBEAAEEAIQRBASEBIAJBIkYEQEEzIQNBASEFDCkLIAJFIAJBCkZyDR9BASEDQQEhBQwoCyAAQR47AQQgACAAKAIMEQAAQQAhBEEBIQVBCCEDIAJBMWsOCCcCAAICAQIhAgtBBiEDDCYLQQchAwwlC0HFACEDIAJB3wBGDSRBASEBIAJBX3FBwQBrQRpPDRsMJAsgAEEeOwEEIAAgACgCDBEAAEEAIQQgAkHhAEYEQEEBIQVBwgAhAwwkC0EBIQVBxQAhAyACQd8ARiACQeIAa0EZSXINI0EBIQEgAkHBAGtBGk8NGgwjCyAAQR47AQQgACAAKAIMEQAAQQAhBCACQeEARgRAQQEhBUEYIQMMIwtBASEFQcUAIQMgAkHfAEYgAkHiAGtBGUlyDSJBASEBIAJBwQBrQRpPDRkMIgsgAEEeOwEEIAAgACgCDBEAAEEAIQQgAkHhAEYEQEEBIQVBOiEDDCILQQEhBUHFACEDIAJB3wBGIAJB4gBrQRlJcg0hQQEhASACQcEAa0EaTw0YDCELIABBHjsBBCAAIAAoAgwRAABBACEEIAJB4wBGBEBBASEFQTchAwwhC0EBIQVBxQAhAyACQd8ARg0gQQEhASACQV9xQcEAa0EaTw0XDCALIABBHjsBBCAAIAAoAgwRAABBACEEIAJB7ABGBEBBASEFQTAhAwwgC0EBIQVBxQAhAyACQd8ARg0fQQEhASACQV9xQcEAa0EaTw0WDB8LIABBHjsBBCAAIAAoAgwRAABBACEEIAJB7ABGBEBBASEFQTkhAwwfC0EBIQVBxQAhAyACQd8ARg0eQQEhASACQV9xQcEAa0EaTw0VDB4LIABBHjsBBCAAIAAoAgwRAABBACEEIAJB7gBGBEBBASEFQcAAIQMMHgtBASEFQcUAIQMgAkHfAEYNHUEBIQEgAkFfcUHBAGtBGk8NFAwdCyAAQR47AQQgACAAKAIMEQAAQQAhBCACQe8ARgRAQQEhBUE7IQMMHQtBASEFQcUAIQMgAkHfAEYNHEEBIQEgAkFfcUHBAGtBGk8NEwwcCyAAQR47AQQgACAAKAIMEQAAQQAhBCACQe8ARgRAQQEhBUEdIQMMHAtBASEFQcUAIQMgAkHfAEYNG0EBIQEgAkFfcUHBAGtBGk8NEgwbCyAAQR47AQQgACAAKAIMEQAAQQAhBCACQe8ARgRAQQEhBUHDACEDDBsLQQEhBUHFACEDIAJB3wBGDRpBASEBIAJBX3FBwQBrQRpPDREMGgsgAEEeOwEEIAAgACgCDBEAAEEAIQQgAkHzAEYEQEEBIQVBOCEDDBoLQQEhBUHFACEDIAJB3wBGDRlBASEBIAJBX3FBwQBrQRpPDRAMGQsgAEEeOwEEIAAgACgCDBEAAEEAIQQgAkHzAEYEQEEBIQVBwQAhAwwZC0EBIQVBxQAhAyACQd8ARg0YQQEhASACQV9xQcEAa0EaTw0PDBgLIABBHjsBBCAAIAAoAgwRAABBACEEIAJB9ABGBEBBASEFQRchAwwYC0EBIQVBxQAhAyACQd8ARg0XQQEhASACQV9xQcEAa0EaTw0ODBcLIABBHjsBBCAAIAAoAgwRAABBACEEIAJB9ABGBEBBASEFQTYhAwwXC0EBIQVBxQAhAyACQd8ARg0WQQEhASACQV9xQcEAa0EaTw0NDBYLIABBHjsBBCAAIAAoAgwRAABBACEEIAJB9ABGBEBBASEFQT0hAwwWC0EBIQVBxQAhAyACQd8ARg0VQQEhASACQV9xQcEAa0EaTw0MDBULIABBHjsBBCAAIAAoAgwRAABBACEEIAJB+QBGBEBBASEFQT8hAwwVC0EBIQVBxQAhAyACQd8ARg0UQQEhASACQV9xQcEAa0EaTw0LDBQLIABBHjsBBCAAIAAoAgwRAABBACEEQQEhBUHFACEDIAJB3wBGDRNBASEBIAJBX3FBwQBrQRpPDQoMEwsgAEEfOwEEIAAgACgCDBEAAEEAIQRBASEFQcYAIQMgAkEgRiACQcEAa0EaSXIgAkEwa0EKSXINEkEBIQEgAkHhAGtBGk8NCQwSC0EAIQQMAQtBASEECyAAIAQ7AQQgACAAKAIMEQAAC0EBIQEMBQtBPiEDDA0LQQAhBEEuIQMMDAsgAkEhayICQR5LDQAgBSEBQQEgAnRBgZCAgARxRQ0CDAsLIAUhAQwBC0EAIQRBBSEDIAUhAQJAIAJB5gBrDgQKAQEKAAsgAkH1AEYNCQsgAUEBcQ8LQQAhBEEbIQMMBwtBACEEC0ErIQMMBQtBACEEQRAhAwwEC0EZIQMMAwtBASEEQQIhAwwCC0EyIQMMAQtBFCEDCyAAIAQgACgCCBEFAAwACwALC9MpAQAjAAvMKQ0ABwABAAUACQABAAkACwABABIADQABABgADwABABkAEQABABoAEwABAB4AAwABADIAJwABADAALgABAC0ATQABACYAFQACAAAABgA6AAQAJwAoACkAKgANABkAAQAFABwAAQAJAB8AAQASACIAAQAYACUAAQAZACgAAQAaACsAAQAeAAMAAQAyACcAAQAwAC4AAQAtAE0AAQAmABcAAgAAAAYAOgAEACcAKAApACoADQAHAAEABQAJAAEACQALAAEAEgANAAEAGAAPAAEAGQARAAEAGgATAAEAHgACAAEAMgAnAAEAMAAuAAEALQBHAAEAJQBNAAEAJgA6AAQAJwAoACkAKgANAAcAAQAFAAkAAQAJAAsAAQASAA0AAQAYAA8AAQAZABEAAQAaABMAAQAeAAIAAQAyACcAAQAwAC4AAQAtAEAAAQAlAE0AAQAmADoABAAnACgAKQAqAAcAAwABAAMABQABAAQACAABADEAPwABACIAMQACACMAJAAwAAMACQAaAB4ALgAEAAUAEgAYABkACgAHAAEABQAJAAEACQALAAEAEgAPAAEAGQARAAEAGgATAAEAHgAnAAEAMAAuAAEALQBCAAEAJgA6AAQAJwAoACkAKgAHADIAAQADADUAAQAEAAgAAQAxAD8AAQAiADEAAgAjACQAOgADAAkAGgAeADgABAAFABIAGAAZAAcACwABABIAPAABAAwAPgABABEAHgABACwAHwABADAATAABACsAQAAGABYAFwAYABkAHAAeAAcACwABABIAPAABAAwAPgABABEAHgABACwAHwABADAASwABACsAQAAGABYAFwAYABkAHAAeAAcACwABABIAPAABAAwAPgABABEAHgABACwAHwABADAARgABACsAQAAGABYAFwAYABkAHAAeAAcACwABABIAPAABAAwAPgABABEAHgABACwAHwABADAARQABACsAQAAGABYAFwAYABkAHAAeAAcACwABABIAPAABAAwAPgABABEAHgABACwAHwABADAAPQABACsAQAAGABYAFwAYABkAHAAeAAcACwABABIAPAABAAwAPgABABEAHgABACwAHwABADAANwABACsAQAAGABYAFwAYABkAHAAeAAcACwABABIAPAABAAwAPgABABEAHgABACwAHwABADAAPgABACsAQAAGABYAFwAYABkAHAAeAAQAQgABAAAARAABAAIASAABAB8ARgAIAAUABgAJABIAGAAZABoAHgAEABcAAQAAAEoAAQACAE4AAQAfAEwACAAFAAYACQASABgAGQAaAB4ABQALAAEAEgBQAAEADAAfAAEAMAAqAAEALABAAAYAFgAXABgAGQAcAB4AAwBSAAEAAABUAAEAAgBWAAgABQAGAAkAEgAYABkAGgAeAAMAQgABAAAARAABAAIARgAIAAUABgAJABIAGAAZABoAHgAFAAsAAQASAFgAAQAMAB8AAQAwACgAAQAsAEAABgAWABcAGAAZABwAHgAFAAsAAQASAFoAAQAMAB8AAQAwACMAAQAsAEAABgAWABcAGAAZABwAHgAFAAsAAQASAFwAAQAMAB8AAQAwAC0AAQAsAEAABgAWABcAGAAZABwAHgACAGAAAwAJABoAHgBeAAYAAAAFAAYAEgAYABkABAALAAEAEgAfAAEAMAAmAAEALABAAAYAFgAXABgAGQAcAB4AAgBGAAMACQAaAB4AQgAGAAAABQAGABIAGAAZAAIAZAAEAAUAEgAYABkAYgAFAAMABAAJABoAHgACAFYAAwAJABoAHgBSAAYAAAAFAAYAEgAYABkAAQBmAAgAAQAHAAgADQAOAA8AEAARAAMAaAACAAEADQBqAAIADgAPAGwAAgAQABEAAQBuAAYAAQANAA4ADwAQABEAAwApAAEALwBDAAEALgBwAAQAFgAXABkAHAACADMAAQAvAHAABAAWABcAGQAcAAIAcgACAA4ADwB0AAIAEAARAAEAdgACAAEADQABAHgAAgAYABkAAQB6AAIAAQANAAEAfAACAAEADQABAH4AAgAHAAgAAQCAAAIAAQANAAIAggABABMAhAABABsAAQCAAAIAAQANAAIAhgABABMAiAABABsAAQB6AAIAAQANAAEAdgACAAEADQABAIoAAgAHAAgAAQCMAAEAAgABAI4AAQABAAEAkAABAAEAAQCSAAEAFAABAJQAAQATAAEAlgABAAAAAQCYAAEACwABAJoAAQAKAAEAnAABAA0AAQCeAAEAFgABAKAAAQAVAAEAogABAAEAAQCkAAEAAQABAKYAAQABAAEAqAABAAEAAQCqAAEAAQABAKwAAQABAAEArgABAAAAAQCwAAEAFQABALIAAQABAAEAggABABMAAQC0AAEAAQABALYAAQANAAEAuAABAA0AAQC6AAEABgABALwAAQAdAAEAvgABABcAAQDAAAEAHAABAMIAAQANAAEAxAABAA0AAQDGAAEAAQABAMgAAQAAAAAAAAAAAAAALAAAAFgAAACDAAAArgAAAMoAAADsAAAACAEAACMBAAA+AQAAWQEAAHQBAACPAQAAqgEAAMUBAADZAQAA7QEAAAICAAATAgAAJAIAADkCAABOAgAAYwIAAHECAACDAgAAkQIAAJ8CAACtAgAAuAIAAMUCAADOAgAA2wIAAOUCAADuAgAA8wIAAPgCAAD9AgAAAgMAAAcDAAAMAwAAEwMAABgDAAAfAwAAJAMAACkDAAAuAwAAMgMAADYDAAA6AwAAPgMAAEIDAABGAwAASgMAAE4DAABSAwAAVgMAAFoDAABeAwAAYgMAAGYDAABqAwAAbgMAAHIDAAB2AwAAegMAAH4DAACCAwAAhgMAAIoDAACOAwAAkgMAAJYDAACaAwAAngMAAKIDAACmAwAAqgMAAAAAAAAAAAAAAAAAAAABAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAAAAAAAAAAAAAAAAAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQAAAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMABQAHAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAA0ADwARAAAAAAAAABMAAAA0AAUAPwAxADEATgBNADoAOgA6ADoAAAAAAC4AAAAAACcABgACAAAAAAAAAAAAAAAAAAEAAAAAAAAAAwAAAAAAAAABAAAAAAAAAAAAOAAAAAAAAQAAAAAAAAAAAEkAAAAAAAEBAAAAAAAAAAAEAAAAAAABAAAAAAAAAAAAJAAAAAAAAQEAAAAAAAAAACAAAAAAAAEBAAAAAAAAAAAHAAAAAAABAQAAAAAAAAAAJwAAAAAAAQAAAAAAAAAAADoAAAAAAAEAAAAAAAAAAAA2AAAAAAABAQAAAAAAAAEBJQAAAAAAAQEAAAAAAAABAjIAAAAAAAIBAAAAAAAAAQIyAAAAAAAAAAQAAAEAAAIAAAAAAAAAAQIyAAAAAAAAACQAAAEAAAIBAAAAAAAAAQIyAAAAAAAAACAAAAEAAAIBAAAAAAAAAQIyAAAAAAAAAAcAAAEAAAIBAAAAAAAAAQIyAAAAAAAAACcAAAEAAAIAAAAAAAAAAQIyAAAAAAAAADoAAAEAAAIAAAAAAAAAAQIyAAAAAAAAADYAAAEAAAEBAAAAAAAAAQEhAAAAAAABAAAAAAAAAAEBIQAAAAAAAgAAAAAAAAABAjEAAAAAAAAAOAAAAQAAAgAAAAAAAAABAjEAAAAAAAAASQAAAQAAAQEAAAAAAAABAjEAAAAAAAEAAAAAAAAAAQIxAAAAAAABAQAAAAAAAAAADgAAAAAAAQEAAAAAAAAAABkAAAAAAAEBAAAAAAAAAAAfAAAAAAABAQAAAAAAAAEDMgAAAAAAAQEAAAAAAAAAABwAAAAAAAEAAAAAAAAAAQMyAAAAAAABAAAAAAAAAAAAEwAAAAAAAQEAAAAAAAAAABoAAAAAAAEAAAAAAAAAAQIyAAAAAAABAAAAAAAAAAAAFAAAAAAAAQEAAAAAAAAAAAsAAAAAAAEBAAAAAAAAAQQyAAAAAAABAQAAAAAAAAAAGAAAAAAAAQAAAAAAAAABBDIAAAAAAAEBAAAAAAAAAAAMAAAAAAABAQAAAAAAAAAACgAAAAAAAQEAAAAAAAAAAAkAAAAAAAEBAAAAAAAAAQUyAAAAAAABAAAAAAAAAAEFMgAAAAAAAQAAAAAAAAABAzEAAAAAAAEBAAAAAAAAAQMxAAAAAAABAQAAAAAAAAEFMAAAAAAAAQEAAAAAAAABASsAAAAAAAEBAAAAAAAAAAAVAAAAAAABAQAAAAAAAAAAEgAAAAAAAQEAAAAAAAABASwAAAAAAAEB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'));
for (var i = 0; i < encoded_levels.length; i++){
    var opt = document.createElement('option');
    opt.value = i;
    opt.innerHTML = "L"+i;
    document.getElementById('levels').appendChild(opt);
}
document.getElementById('levels').value = 3;

function get_visitor(level) {
  switch (level) {
        case 0:
            return new L0Visitor();
        case 1:
            return new L1Visitor();
        case 2:
            return new L2Visitor();
        case 3:
            return new L3Visitor();
}
}
function get_emitter(level) {
  switch (level) {
        case 0:
            return new L0Emitter();
        case 1:
            return new L1Emitter();
        case 2:
            return new L2Emitter();
        case 3:
            return new L3Emitter();
}
}