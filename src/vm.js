class State {
    constructor(memory, registers, data, memory_id){
        this.memory = memory
        this.registers = registers;
        this.data = data;
        this.memory_id = memory_id
    }
}

function number_to_byte_array(number, size) {
    const byteCount = Math.ceil(size / 8);
    const byteArray = new Array(byteCount);

    for (let i = byteCount - 1; i >= 0; i--) {
      byteArray[i] = (number & 0xff).toString(16).padStart(2,'0').toUpperCase()
      number = number >> 8;
    }

    return byteArray;
}

function byte_array_to_number(byteArray, type) {
    let number = 0;
    let signed = type === DT.SIGNED;
    const signBit = 0x80 << (byteArray.length - 1) * 8;

    for (let i = 0; i < byteArray.length; i++) {
      number = (number << 8) + parseInt(byteArray[i], 16);
    }

    if (signed && (number & signBit)) {
        number -= 1 << (byteArray.length * 8);
    }
  
    return number;
}


class VirtualMachine {

    memorySize = 128;

    update_vm(program, memory = new Array(this.memorySize).fill('00'), registers = {'$!':0, '$?':0, '$x':0, '$y':0, '$n':0, '$m':0, '$fp': this.memorySize}) {
        this.program = program;
        this.state = this.init_state(memory, registers);
    }

    init_state(memory, registers){
        var state_data={};
        // Secondary array identical to memory, this will hold a grouping of memory that belongs to the same data and is used for coloring in the memory array
        var memory_id = new Array(this.memorySize).fill('');
        map_strings_to_memory(this.program.data);

        return new State(memory,
            registers,
            state_data,
            memory_id);

        function map_strings_to_memory(program_data){
            var pointer = 0;
            Object.entries(program_data).forEach(([id,str]) =>{
                //let pointer = memory_for_constants.length;
                state_data[id] = pointer;
                for(let char in str){
                    memory_id[pointer] = id;
                    memory[pointer] = number_to_byte_array(str.charCodeAt(char),8)[0];
                    pointer += 1;
                }
                memory_id[pointer] = id;
                memory[pointer] = number_to_byte_array(0, 1);
                pointer += 1;
            });
        }
    }

    execute_bytecode() {
        var pc = this.state.registers['$!'];
        this.program.instructions[pc].handle(this);
        this.state.registers['$!']++;
    }

    assign_binary(cond, not, writer, reader1, opr, reader2) {
        if (cond && this.check_condition())
        return;
        let RHS = this.evaluate_binary(reader1, opr, reader2);
        if (not) {
            RHS = this.handle_not(RHS);
        }
        this.write(writer, RHS);
    }

    assign_unary(cond, not, writer, opr, reader) {
        if (cond && this.check_condition())
        return;
        let RHS = this.evaluate_unary(opr, reader);
        if (not) {
            RHS = this.handle_not(RHS);
        }
        this.write(writer, RHS);
    }

    assign(cond, not, writer, reader) {
        if (cond && this.check_condition())
        return;
        let RHS = this.read(reader);
        if (not) {
            RHS = this.handle_not(RHS);
        }
        this.write(writer, RHS);
    }

    evaluate_binary(v1, opr, v2) {
        var result = eval(`${this.read(v1)} ${opr} ${this.read(v2)}`);
        if (typeof result == "boolean") {
            if (result) {
                return 1;
            } else {
                return 0;
            }
        }
        return result;
    }

    evaluate_unary(opr, v) { return eval(`${opr} ${this.read(v)}`); }

    check_condition() {
        return !this.state.registers['$?'];
    }
    
    write(writer, RHS){
        switch(writer.type){
            case CONTENT_TYPES.MEMORY:
                let mem_index =  this.read(writer.id);
                //TODO: make work with signed & float
                let hex8_array = number_to_byte_array(RHS,writer.datatype.size)
                for (let i = 0; i < hex8_array.length; i++){
                    this.state.memory[mem_index] = hex8_array[i];
                    mem_index += 1;
                }
                break;
            case CONTENT_TYPES.REGISTER:
                if (writer.id in this.state.registers){
                    this.state.registers[writer.id] = RHS;
                }else {
                    throw new Error("Tried to write to a register that does not exist");
                } 
                break;
        }
    }
    
    read(reader){
        switch(reader.type){
            case CONTENT_TYPES.REGISTER:
                if (reader.id in this.state.registers){
                    return this.state.registers[reader.id];
                }
                throw new Error("Register ",reader.id," not found");
            case CONTENT_TYPES.MEMORY:
                let mem_index = this.read(reader.id);
                let mem_chunk = new Array();
                let return_value = -1;
                try{
                    for (let i = 0; i < (reader.datatype.size/8); i++){
                        mem_chunk[i] = this.state.memory[mem_index];
                        mem_index += 1;
                    }
                    return_value = byte_array_to_number(mem_chunk,reader.datatype.type);

                }catch (error){
                    if(mem_index > this.state.memory.length){
                        console.log("Memory index out of bounds");
                    }
                }
                return return_value
            case CONTENT_TYPES.CONSTANT:
                if (reader.id in this.program.constants){
                    return parseInt(this.program.constants[reader.id]);
                }
                throw new Error("Constant ",reader.id," not found");
            case CONTENT_TYPES.DATA:
                if (reader.id in this.state.data){
                    return this.state.data[reader.id];
                }
                throw new Error("Data ",reader.id," not found")
            case CONTENT_TYPES.LABEL:
                if (reader.id in this.program.labels){
                    return this.program.labels[reader.id];
                }
                throw new Error("Label ",reader.id," not found")
            case CONTENT_TYPES.NUMBER:
                //the number that the reader holds, is the id in this case
                return reader.id;
            case CONTENT_TYPES.EXPRESSION:
                return this.read(reader.reader1);
            case CONTENT_TYPES.UN_EXPRESSION:
                return this.evaluate_unary(reader.opr, reader.reader1);
            case CONTENT_TYPES.BIN_EXPRESSION:
                return this.evaluate_binary(reader.reader1, reader.opr, reader.reader2);
        }
    }
    
    syscall(){
        switch(this.state.registers["$x"]) {
            case 0: // print int
                console.log(this.state.registers["$y"]);
                outputSpan.innerHTML += this.state.registers["$y"] + "\n";
                break;
            case 1: // print str
                var idx = this.state.registers["$y"];
                var str = "";
                while(this.state.memory[idx] != 0) {
                    str += String.fromCharCode(parseInt(this.state.memory[idx], 16));
                    idx++;
                }
                console.log(str);
                outputSpan.innerHTML += str + "\n";
                break;
            default:
                console.log("Syscall Error");
                outputSpan.innerHTML += "Syscall Error\n";
                break;
        }
    }
    
    handle_not(RHS) {
        if (RHS == 0) {
            return 1;
        } 
        return 0;
    } 
}