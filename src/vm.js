// var pc = 0;
// var running = true

// function execute_instruction(instruction){
//     switch(instruction[0]){
//         case BC.DEC_CONST:
//         case BC.DEC_DATA:
//         case BC.LABEL:
//             break;
//         case BC.SYSCALL:
//             break;
//         case BC.ASSIGN_BIN:
//         case BC.ASSIGN_UN:
//         case BC.ASSIGN:

//             break;
//         case BC.COND_BIN:
//         case BC.COND_UN:
//         case BC.COND:
//     }
// }
// while(running){

//     //Fetch instruction
//     var curr_instruction = instructions[pc]
    
// }


// /////////
// const _writable_memory = 7000;
// const _free_memory_pointer = 7000;

// var state = {
//     labels: {},
//     cs: {},
//     data: {},
//     registers: {
//         "$!":0, //PC
//         "$?":0, //Bool
//         "$x":0,
//         "$y":0,
//         "$j":0
//     },
//     memory: new Array(10000),
//     writable_memory: _writable_memory,
//     free_memory_pointer: _free_memory_pointer
// }

// var program = [];

// function get_reader_type(reader){
//     if(reader.child(0).type == 'assign' || reader.child(0).type == 'datavar'){
//         return reader.child(0).child(0).type;
//     } else {
//         return reader.child(0).type;
//     }
// }

// function handle_reader(reader){
//     var reader_content = reader.text;
//     var reader_type = get_reader_type(reader);
//     switch(reader_type){
//         case 'register':
//             if (reader_content in state.registers){
//                 return state.registers[reader_content];
//             }
//             throw new Error("Register ",reader_content," not found");
//         case 'memory':
//             var startIndex = state.registers[reader.child(0).child(0).child(1).text];
//             var stopIndex = startIndex + parseInt(reader.child(0).child(0).child(3).text);
//             var result = "";
//             if (stopIndex < state.memory.length) {
//                 for (var i = startIndex; i < stopIndex; i++) {
//                     result += state.memory[i];
//                 }
//                 return result;        
//             }
//             throw new Error("Memory out of bounds");
//         case 'constant':
//             if (reader_content in state.cs){
//                 return parseInt(state.cs[reader_content]);
//             }
//             throw new Error("Constant ",reader_content," not found");
//         case 'data':
//             if (reader_content in state.data){
//                 return state.data[reader_content];
//             }
//             throw new Error("Data ",reader_content," not found")
//         case 'label':
//             if (reader_content in state.labels){
//                 return state.labels[reader_content];
//             }
//             throw new Error("Label ",reader_content," not found")
//         case 'number':
//             return parseInt(reader_content);
//     }
// }

// function handle_binary(v_left,oper,v_right){
//     switch(oper.text){
//         case '+':
//             return v_left + v_right;
//         case '-':
//             return v_left - v_right;
//         case '*':
//             return v_left * v_right;
//         case '/':
//             return v_left / v_right;
//         case '|':
//             return v_left || v_right ;
//         case '&':
//             return v_left && v_right;
//         case '>':
//             return v_left > v_right;
//         case '<':
//             return v_left < v_right;
//         case '=':
//             return v_left == v_right;
//     }
//     console.log(console.error("reeee"));
//     throw new Error("Operator:",oper," unknown")
// }

// function handle_unary(oper,v){
//     switch(oper.text){
//         case '-':
//             return -v;
//         case '&':
//             return 0; //Not implemented
//     }
// }

// function handle_expression(expression){
//     var numOfChildren = expression.childCount;
//     switch(numOfChildren){
//         case 1: // reader
//             return handle_reader(expression.child(0));
//         case 2: // oper, reader
//             return handle_unary(expression.child(0),handle_reader(expression.child(1)));
//         case 3: // reader, oper, reader
//             return handle_binary(handle_reader(expression.child(0)), expression.child(1), handle_reader(expression.child(2)))
//     }
// }

// function handle_writer(statement){
//     var writer = statement.child(0).child(0).child(0);
//     var expression = statement.child(2); 
//     switch(writer.type){
//         case 'memory':
//             var register = writer.child(1).text;
//             var bytes = parseInt(writer.child(3).text);
//             var expression_result = handle_expression(expression);
//             var is_number = parseInt(expression_result);
//             var startIndex = state.registers[register];
//             if (startIndex + bytes > state.writable_memory) { 
//                 console.warn("Memory out of bounds");
//                 break;
//             }
//             if (!isNaN(is_number)) {
//                 state.memory[state.registers[register]] = expression_result;
//                 return;
//             }
//             for (var i = 0; i < bytes; i++) {
//                 state.memory[i+startIndex] = expression_result.charAt(i);
//             }
//             state.memory[bytes]=null; // string terminal    
//             break;
//         case 'register':
//             state.registers[writer.text.toString()] = handle_expression(expression);
//             break;
//     }
// }

// function handle_syscall(){
//     switch(state.registers["$x"]) {
//         case 0: // print int
//             console.log(state.memory[state.registers["$y"]]);
//             break;
//         case 1: // print str
//             var idx = state.registers["$y"];
//             var str = "";
//             while(state.memory[idx] != null) {
//                 str += state.memory[idx];
//                 idx++;
//             }
//             console.log(str);
//             break;
//         default:
//             console.log("Some kind of meaningful error msg");
//     }
// }

// function handle_statement(statement){
//     if(statement.childCount == 1 && statement.text == 'syscall'){
//         handle_syscall(statement.child(0));
//     }else{
//         if(statement.child(1).type.toString() == ':='){
//             handle_writer(statement);
//         }else if(statement.child(1).type.toString() == '?='){
//             if(!state.registers['$?']) return;
//             handle_writer(statement);
//         }
//     }
// }

// function handle_declaration(declaration){
//     let type = declaration.child(0).text;
//     let [declarator, value] = declaration.child(1).text.split(' ');
//     let bytes = value.split("").length;

//     if (bytes + state.free_memory_pointer > state.memory.length) {
//         console.warn("Declation: Memory out of bounds")
//         return;
//     }

//     if(type == 'const'){
//         if (isNaN(parseInt(value))) {
//             console.error("Const can only be assigned numbers.");
//             return;
//         }
//         state.memory[state.free_memory_pointer] = value;
//         state.cs[declarator] = state.free_memory_pointer;
//         state.free_memory_pointer++;
//     }else if(type == 'data'){
//         state.data[declarator] = state.free_memory_pointer;
//         for (var i = 0; i < bytes; i++) {
//             state.memory[state.free_memory_pointer+i] = value.charAt(i);
//         }
//         state.free_memory_pointer+=bytes;
//     }
// }




// function wipe_data(){
//     for (let key in state.registers) {
//         state.registers[key] = 0;
//     }
//     state.cs = {};
//     state.data = {};
//     state.labels = {};
//     state.writable_memory = _writable_memory;
//     state.free_memory_pointer = _free_memory_pointer;
// }

