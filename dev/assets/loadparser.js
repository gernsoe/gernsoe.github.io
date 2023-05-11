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
var emit_functions = new Array();
emit_functions.push((function (statement){
    SourceCodeBuilder.addStatement(statement.text)
}))
encoded_levels.push(decode('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IAARAAEAHgATAAEAHAAUAAEAGwAbAAEAFwAgAAEAGAAHAAkAAQAMAAsAAQAQABMAAQATABEAAQAeACcAAQAaABYAAgAcAB0ADwADAAkACgALAAoAFQABAAAAFwABAAsAGgABAAwAHQABABAAIAABABEABwABACAAEQABAB4AEwABABwAFAABABsAIAABABgACgAHAAEACwAJAAEADAALAAEAEAANAAEAEQAjAAEAAAAHAAEAIAARAAEAHgATAAEAHAAUAAEAGwAgAAEAGAAFACUAAQADACgAAQAEAAkAAQAfABgAAQAWACsABAALAAwAEAARAAUAAwABAAMABQABAAQACQABAB8AGAABABYALQAEAAsADAAQABEABwAJAAEADAALAAEAEAANAAEAEQARAAEAHgATAAEAHAAUAAEAGwAeAAEAGAADAC8AAQAAADEAAQACADMABAALAAwAEAARAAMAFQABAAAANQABAAIANwAEAAsADAAQABEAAQA5AAYAAwAEAAsADAAQABEAAQA7AAUAAAALAAwAEAARAAEALwAFAAAACwAMABAAEQABAD0ABAABAAUABgASAAEAPwAEAAEABQAGABIAAQBBAAIABQAGAAIAQwABAAUARQABAAYAAQBHAAIAAQASAAEASQACAAEAEgACAEsAAQABAE0AAQASAAEATwABAAEAAQBRAAEABwABAFMAAQACAAEAVQABAAAAAQBXAAEADwABAFkAAQANAAEAWwABAAEAAQBdAAEAAQABAF8AAQABAAEAYQABAAAAAQBjAAEAAQABAGUAAQAAAAEAZwABAAEAAQBpAAEAAQABAGsAAQAOAAEAbQABAAEAAQBvAAEAEAABAFEAAQAIAAEAcQABAAEAAAAAAAAAAAAAAAAAAAAfAAAAPgAAAFcAAAB2AAAAjwAAAK4AAADNAAAA4AAAAPMAAAAJAQAAFgEAACMBAAAsAQAANAEAADwBAABDAQAASgEAAE8BAABWAQAAWwEAAGABAABnAQAAawEAAG8BAABzAQAAdwEAAHsBAAB/AQAAgwEAAIcBAACLAQAAjwEAAJMBAACXAQAAmwEAAJ8BAACjAQAApwEAAKsBAACvAQAAAAAAAAAAAwADAAMAAQAAAAEAAQABAAIAAgAAAAIAAQACAAIAAAAAAAAAAAAAAQABAAABAAABAAABAAABAAABAAABAQABAQABAQABAQABAQABAAABAAABAAABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACEAAAAhAAAAAAAAAAAAAAAAAAAAAwAAAAMAAAAAAAAAAAAAAAMAAAADAAAAAwAAAAAAAAAEAAAAIQAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAQABAAAAAQABAAEAAQAAAAAAAQABAAEAAQABAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAFAAAAAAAAAAAAAAAAAAcACQAAAAAAAAALAA0AAAAAACMABQAYACEAIAAAAAAAFAATAAAAEQAKAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAMAAAAAAAAAAQEAAAAAAAAAABkAAAAAAAEBAAAAAAAAAAApAAAAAAABAQAAAAAAAAAACwAAAAAAAQEAAAAAAAAAACgAAAAAAAEBAAAAAAAAAAARAAAAAAABAQAAAAAAAAAAJQAAAAAAAQEAAAAAAAAAABUAAAAAAAEAAAAAAAAAAAAGAAAAAAABAQAAAAAAAAAAFgAAAAAAAQEAAAAAAAABAiAAAAAAAAIBAAAAAAAAAQIgAAAAAAAAAAsAAAEAAAIBAAAAAAAAAQIgAAAAAAAAACgAAAEAAAIBAAAAAAAAAQIgAAAAAAAAABEAAAEAAAIBAAAAAAAAAQIgAAAAAAAAACUAAAEAAAEBAAAAAAAAAQEXAAAAAAACAQAAAAAAAAECHwAAAAAAAAAZAAABAAACAQAAAAAAAAECHwAAAAAAAAApAAABAAABAQAAAAAAAAECHwAAAAAAAQEAAAAAAAABARUAAAAAAAEBAAAAAAAAAQMgAAAAAAABAQAAAAAAAAAADwAAAAAAAQAAAAAAAAABAyAAAAAAAAEBAAAAAAAAAAAQAAAAAAABAAAAAAAAAAECIAAAAAAAAQEAAAAAAAABAx8AAAAAAAEBAAAAAAAAAQQgAAAAAAABAQAAAAAAAAEBHAAAAAAAAQEAAAAAAAABBR4AAAAAAAEBAAAAAAAAAQEbAAAAAAABAQAAAAAAAAAAAgAAAAAAAQEAAAAAAAAAAAMAAAAAAAEBAAAAAAAAAQEdAAAAAAABAQAAAAAAAAEBGgAAAAAAAQEAAAAAAAABARkAAAAAAAEBAAAAAAAAAAAEAAAAAAABAQAAAAAAAAAAGgAAAAAAAQEAAAAAAAAAAB8AAAAAAAEBAAAAAAAAAAAOAAAAAAABAQAAAAAAAAECFAAAAAAAAQEAAAAAAAAAACYAAAAAAAEBAAAAAAAAAAAcAAAAAAABAQAAAAAAAAAADAAAAAAAAQEAAAAAAAABAhYAAAAAAAEBAAAAAAAAAAANAAAAAAABAQAAAAAAAAEBFAAAAAAAAQEAAAAAAAABAxgAAAABAAEBAAAAAAAAAgAAAAAAAAABAQAAAAAAAAEDGAAAAAIAAQEAAAAAAAABARgAAAAAAAEBAAAAAAAAAAASAAAAAAABAQAAAAAAAAECGQAAAAAAAQEAAAAAAAAAAB0AAAAAAAEBAAAAAAAAAQMZAAAAAABtZW1vcnkAY29uc3QAYXNzaWdubWVudABzdGF0ZW1lbnQAY29uc3RhbnQAc3RhdGVtZW50cwBkZWNsYXJhdGlvbnMAb3BlcmF0b3IAcmVnaXN0ZXIAd3JpdGVyAHJlYWRlcgBudW1iZXIAZGF0YXZhcgBjb25zdGFudF9kZWNsYXJhdGlvbgBkYXRhX2RlY2xhcmF0aW9uAGV4cHJlc3Npb24AYXNzaWduAHN5c2NhbGwAbGFiZWwAY29uZGl0aW9uYWwAdHlwZQBzb3VyY2VfZmlsZQBlbmQAZGF0YQBdAFsAPz0AOj0AOwBzdGF0ZW1lbnRzX3JlcGVhdDEAZGVjbGFyYXRpb25zX3JlcGVhdDEALAAKAAAADQAAACEAAAAAAAAAFAAAAAAAAAArAAAAAgAAAAMAAAACAAAABQAAANAFAAAAAAAAcAMAAGAGAACgCwAAJAwAABQEAAAgBAAAQAQAALAEAADyBAAAAAUAACAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzQoAAOAKAAAMCwAA/wkAANEKAADdCgAA2goAAGoKAAB/CgAAGgoAANEKAACqCgAA2AoAAAoLAADWCgAAvAoAAEQKAACiCgAAOwoAAFsKAADBCgAALgoAAIQKAAAjCgAAEAoAAJAKAABUCgAATQoAAJsKAABiCgAA+AkAAPUKAADiCgAAAAAAAAUKAACwCgAA'));
emit_functions.push((function (statement){
    if (statement.childCount === 0)  {
        SourceCodeBuilder.addStatement(statement.text);
        return;
    }
    if (statement.child(0).type == 'goto'){
        SourceCodeBuilder.addStatement(`$! ?= ${statement.child(1).text} - 1;`)
        return;
    }
    SourceCodeBuilder.addStatement(statement.text);
}))
encoded_levels.push(decode('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AQARABMAAQATABUAAQAUABIAAQAfABcAAQAbACYAAQAaABYAAgAdAB4AEQADAAoACwAMAAsAFwABAAAAGQABAAcAHAABAAwAHwABAA0AIgABABEAJQABABIABAABACEAEgABAB8AFAABABwAFQABAB0AIgABABkACwAHAAEABwAJAAEADAALAAEADQANAAEAEQAPAAEAEgAGAAEAIQASAAEAHwAUAAEAHAAVAAEAHQAcAAEAGAAiAAEAGQALAAcAAQAHAAkAAQAMAAsAAQANAA0AAQARAA8AAQASACgAAQAAAAQAAQAhABIAAQAfABQAAQAcABUAAQAdACIAAQAZAAcACwABAA0ADQABABEAFQABABQAEgABAB8ALAABABsAFgACAB0AHgARAAMACgALAAwABwALAAEADQANAAEAEQAVAAEAFAASAAEAHwApAAEAGwAWAAIAHQAeABEAAwAKAAsADAAFACoAAQADAC0AAQAEAAkAAQAgABkAAQAXADAABQAHAAwADQARABIABQADAAEAAwAFAAEABAAJAAEAIAAZAAEAFwAyAAUABwAMAA0AEQASAAgABwABAAcACwABAA0ADQABABEADwABABIAEgABAB8AFAABABwAFQABAB0AHwABABkAAQA0AAcAAwAEAAcADAANABEAEgADABcAAQAAADYAAQACADgABQAHAAwADQARABIAAwA6AAEAAAA8AAEAAgA+AAUABwAMAA0AEQASAAEAQAAGAAAABwAMAA0AEQASAAEAOgAGAAAABwAMAA0AEQASAAEAQgAEAAEABQAGABMAAQBEAAQAAQAFAAYAEwABAEYAAgABABMAAgBIAAEABQBKAAEABgABAEwAAgAFAAYAAQBOAAIAAQATAAIAUAABAAEAUgABABMAAQBUAAIADAARAAEAVgABAAEAAQBYAAEAAgABAFoAAQAIAAEAXAABAAAAAQBeAAEADgABAGAAAQAQAAEAYgABAAEAAQBkAAEAAQABAGYAAQABAAEAaAABAAEAAQBqAAEAAAABAGwAAQABAAEAbgABAAAAAQBwAAEAAQABAHIAAQABAAEAdAABAA8AAQB2AAEAAQABAHgAAQARAAEAWgABAAkAAQB6AAEAAQAAAAAAAAAfAAAAPgAAAGAAAACCAAAApAAAAL0AAADWAAAA6gAAAP4AAAAXAQAA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'));
emit_functions.push((function (statement){
    if (statement.childCount === 0)  {
        SourceCodeBuilder.addStatement(statement.text);
        return;
    }

    var variablePrefix = "_";
    if (statement.child(0).type == 'variable_name'){
        var variableName = variablePrefix + statement.child(0).text;
        var variableType = statement.child(2).text;
        variables.variableTypes[variableName] = variableType;
        var variableSize = parseInt(variableType.replace(/\D/g, ''));
        var memory_allocation = "";
        for (var i = 0; i < variableSize/8; i++) {
            memory_allocation += "0";
        }
        var dataCode = `data &${variableName} "${memory_allocation}";\n`;
        var assign = `$n:=&${variableName};\n`;
        SourceCodeBuilder.addDeclaration(dataCode);
        SourceCodeBuilder.addStatement(assign);
        if (!statement.child(4).toString().includes('variable_name')) { 
            expr = `[$n,${variableType}]:=${statement.child(4).text};\n`;
            SourceCodeBuilder.addStatement(expr);
        } else {
            buildExpressionWithVariable(statement, 2);
        }
        
        return;
    }
    
    
    if (statement.childCount >= 3) {
        if (statement.child(2).toString().includes('variable_name')) {
           buildExpressionWithVariable(statement, 0)
           return;
        }     
    }

    SourceCodeBuilder.addStatement(statement.text);

    function buildExpressionWithVariable(statement, childOffset) {
        var binaryExpression = statement.child(2 + childOffset).childCount === 3;
        var reader1 = statement.child(2 + childOffset).child(0).child(0);
        var reader2 = binaryExpression ? statement.child(2 + childOffset).child(2).child(0) : null;
        var reader1Name = variablePrefix + reader1.text;
        var reader2Name = reader2 == null ? "" : variablePrefix + reader2.text;
        var expression = statement.child(2 + childOffset);
        // L2: $x := f + g
        // L0: 
        // $n := &f;
        // $m := &g;
        // $x := [$n, u8] + [$m,u32]
        if (binaryExpression && reader1.type === 'variable_name' && reader2.type === 'variable_name') {
            SourceCodeBuilder.addStatement(`$n:=&${reader1Name};\n`);
            SourceCodeBuilder.addStatement(`$m:=&${reader2Name};\n`);
            SourceCodeBuilder.addStatement(`${statement.child(0).text}:=[$n,${variables.variableTypes[reader1Name]}] ${expression.child(1).text} [$m,${variables.variableTypes[reader2Name]}];\n`);
        } 
        // L2: $x := f + 5
        // L0: 
        // $n := &f;
        // $x := [$n, u8] + 5
        else if (binaryExpression && reader1.type === 'variable_name') {
            SourceCodeBuilder.addStatement(`$n:=&${reader1Name};\n`);
            SourceCodeBuilder.addStatement(`${statement.child(0).text}:=[$n,${variables.variableTypes[reader1Name]}] ${expression.child(1).text} ${expression.child(2).text};\n`);
        }

        // L2: $x := 5 + g
        // L0: 
        // $n := &g;
        // $x := 5 + [$n, u8] 
        else if (binaryExpression && reader2.type === 'variable_name') {
            SourceCodeBuilder.addStatement(`$n:=&${reader2Name};\n`);
            SourceCodeBuilder.addStatement(`${statement.child(0).text}:=${expression.child(0).text} ${expression.child(1).text} [$n,${variables.variableTypes[reader2Name]}];\n`);
        }

        // L2: $x := g
        // L0: 
        // $n := &g;
        // $x := [$n, u8] 
        else if (!binaryExpression) {
            SourceCodeBuilder.addStatement(`$n:=&${reader1Name};\n`);
            SourceCodeBuilder.addStatement(`${statement.child(0).text}:=[$n,${variables.variableTypes[reader1Name]}];\n`);
        }
    }
})
)
encoded_levels.push(decode('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AQAeADAAAQAdABcAAgAWABcAFQACACAAIQATAAMADAANAA4ACQALAAEADwANAAEAEwAVAAEAFQASAAEAIgAUAAEAHgAnAAEAHQAXAAIAFgAXABUAAgAgACEAEwADAAwADQAOAAkACwABAA8ADQABABMAFQABABUAEgABACIAFAABAB4AKQABAB0AFwACABYAFwAVAAIAIAAhABMAAwAMAA0ADgAMAAcAAQAJAAkAAQAOAAsAAQAPAA0AAQATAA8AAQAUABEAAQAXABkAAQAAAAcAAQAkABIAAQAiABYAAQAfABcAAQAgACUAAQAcAAwABwABAAkACQABAA4ACwABAA8ADQABABMADwABABQAEQABABcABQABACQAEgABACIAFgABAB8AFwABACAAHQABABsAJQABABwADAAbAAEAAAAdAAEACQAgAAEADgAjAAEADwAmAAEAEwApAAEAFAAsAAEAFwAHAAEAJAASAAEAIgAWAAEAHwAXAAEAIAAlAAEAHAAHAAsAAQAPAA0AAQATABIAAQAiAC0AAQAeABcAAgAWABcAFQACACAAIQATAAMADAANAA4ABwALAAEADwANAAEAEwASAAEAIgAxAAEAHgAXAAIAFgAXABUAAgAgACEAEwADAAwADQAOAAYALwABAAMAMgABAAQACgABACMAGgABABoANQADAAkAFAAXADcAAwAOAA8AEwAGAAMAAQADAAUAAQAEAAoAAQAjABoAAQAaADkAAwAJABQAFwA7AAMADgAPABMACQAHAAEACQALAAEADwANAAEAEwAPAAEAFAARAAEAFwASAAEAIgAWAAEAHwAXAAEAIAAiAAEAHAACAD8AAwAOAA8AEwA9AAUAAwAEAAkAFAAXAAMAQQABAAAAQwABAAIARQAGAAkADgAPABMAFAAXAAMAGwABAAAARwABAAIASQAGAAkADgAPABMAFAAXAAIATQADAAkAFAAXAEsABAAAAA4ADwATAAIARQADAAkAFAAXAEEABAAAAA4ADwATAAEATwAEAAEABwAIABUAAQBRAAQAAQAHAAgAFQACAFMAAQABAFUAAQAVAAEAVwACAAEAFQACAFkAAQAHAFsAAQAIAAEAXQACAAcACAABAF8AAgABABUAAQBhAAIADgATAAEAYwABAAEAAQBlAAEAAgABAGcAAQAKAAEAaQABAAAAAQBrAAEAEgABAG0AAQAQAAEAbwABABIAAQBxAAEABgABAHMAAQABAAEAdQABAAEAAQB3AAEAAQABAHkAAQABAAEAewABAAAAAQB9AAEAAQABAH8AAQAAAAEAgQABAAEAAQCDAAEABQABAIUAAQARAAEAhwABAAEAAQCJAAEAAQABAIsAAQATAAEAZwABAAsAAQCNAAEAAQABAI8AAQABAAAAAAAgAAAAQAAAAGAAAACFAAAAqgAAAM8AAADpAAAAAwEAABoBAAAxAQAATQEAAFoBAABpAQAAeAEAAIQBAACQAQAAlwEAAJ4BAAClAQAAqgEAALEBAAC2AQAAuwEAAMABAADEAQAAyAEAAMwBAADQAQAA1AEAANgBAADcAQAA4AEAAOQBAADoAQAA7AEAAPABAAD0AQAA+AEAAPwBAAAAAgAABAIAAAgCAAAMAgAAEAIAABQCAAAYAgAAHAIAAAAAAAAAAAIAAgADAAUAAwAIAAUAAAAAAAAAAAAAAAAAAwAAAAMAAQABAAAAAQABAAEAAgACAAAAAgABAAIAAgAEAAAABAABAAQAAgAEAAMABAAEAAAAAAAAAAAAAAAAAAABAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEBAAEBAAEBAAEBAAEBAAEAAAEAAAEAAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAAAAAAAAAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAMAAAADAAAAAwAAABcAAAAXAAAAFwAAAAMAAAADAAAABAAAAAQAAAAXAAAABAAAABYAAAAWAAAAFwAAABcAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAWAAAABAAAAAAAAAALAAAAAAAAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAAAAAQABAAAAAQABAAEAAQABAAEAAQAAAAAAAQABAAEAAQABAAEAAQABAAEAAAABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAUAAAAAAAAAAAAHAAAAAAAAAAAACQALAAAAAAAAAA0ADwAAAAAAEQAoAAYAGgAmACUAAAAAABYAFwAAABIACwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAADAAAAAAAAAAEAAAAAAAAAAAAcAAAAAAABAAAAAAAAAAAALwAAAAAAAQAAAAAAAAAAABkAAAAAAAEBAAAAAAAAAAAMAAAAAAABAQAAAAAAAAAALgAAAAAAAQEAAAAAAAAAABIAAAAAAAEAAAAAAAAAAAAsAAAAAAABAAAAAAAAAAAAKgAAAAAAAQEAAAAAAAAAABgAAAAAAAEAAAAAAAAAAAAIAAAAAAABAQAAAAAAAAAAFQAAAAAAAQEAAAAAAAABARsAAAAAAAEBAAAAAAAAAQIkAAAAAAACAAAAAAAAAAECJAAAAAAAAAAZAAABAAACAQAAAAAAAAECJAAAAAAAAAAMAAABAAACAQAAAAAAAAECJAAAAAAAAAAuAAABAAACAQAAAAAAAAECJAAAAAAAAAASAAABAAACAAAAAAAAAAECJAAAAAAAAAAsAAABAAACAAAAAAAAAAECJAAAAAAAAAAqAAABAAACAAAAAAAAAAECIwAAAAAAAAAcAAABAAACAAAAAAAAAAECIwAAAAAAAAAvAAABAAABAAAAAAAAAAECIwAAAAAAAQEAAAAAAAABAiMAAAAAAAEAAAAAAAAAAQEZAAAAAAABAQAAAAAAAAEBGQAAAAAAAQAAAAAAAAABAyMAAAAAAAEBAAAAAAAAAQMjAAAAAAABAQAAAAAAAAEDJAAAAAAAAQEAAAAAAAAAABAAAAAAAAEAAAAAAAAAAQMkAAAAAAABAQAAAAAAAAAAEQAAAAAAAQAAAAAAAAABAiQAAAAAAAEBAAAAAAAAAQQkAAAAAAABAAAAAAAAAAEEJAAAAAAAAQEAAAAAAAABASAAAAAAAAEBAAAAAAAAAQUiAAAAAAABAQAAAAAAAAEBHQAAAAAAAQEAAAAAAAAAAAkAAAAAAAEBAAAAAAAAAQEeAAAAAAABAQAAAAAAAAAAAwAAAAAAAQEAAAAAAAAAAAQAAAAAAAEBAAAAAAAAAQEfAAAAAAABAQAAAAAAAAEBIQAAAAAAAQEAAAAAAAAAACMAAAAAAAEBAAAAAAAAAAAbAAAAAAABAQAAAAAAAAAADQAAAAAAAQEAAAAAAAAAACQAAAAAAAEBAAAAAAAAAQIYAAAAAAABAQAAAAAAAAAAIQAAAAAAAQEAAAAAAAAAACAAAAAAAAEBAAAAAAAAAAArAAAAAAABAQAAAAAAAAAAAgAAAAAAAQEAAAAAAAAAAA4AAAAAAAEBAAAAAAAAAQIcAAAAAQABAQAAAAAAAAECGgAAAAAAAQEAAAAAAAAAAA8AAAAAAAEBAAAAAAAAAQEYAAAAAAABAQAAAAAAAAEDHAAAAAIAAQEAAAAAAAACAAAAAAAAAAEBAAAAAAAAAQMcAAAAAwABAQAAAAAAAAAAHgAAAAAAAQEAAAAAAAAAABMAAAAAAAEBAAAAAAAAAQEcAAAAAAABAQAAAAAAAAECHQAAAAAAAQEAAAAAAAAAAB8AAAAAAAEBAAAAAAAAAQUcAAAABAABAQAAAAAAAAEDHQAAAAAAbWVtb3J5AGNvbnN0AGFzc2lnbm1lbnQAc3RhdGVtZW50AGNvbnN0YW50AHN0YXRlbWVudHMAZGVjbGFyYXRpb25zAG9wZXJhdG9yAHJlZ2lzdGVyAHdyaXRlcgByZWFkZXIAbnVtYmVyAGRhdGF2YXIAZ290bwBjb25zdGFudF9kZWNsYXJhdGlvbgBkYXRhX2RlY2xhcmF0aW9uAGV4cHJlc3Npb24AYXNzaWduAHN5c2NhbGwAbGFiZWwAY29uZGl0aW9uYWwAdHlwZQB2YXJpYWJsZV9uYW1lAHNvdXJjZV9maWxlAHZhcmlhYmxlAGVuZABkYXRhAF0AWwA/PQA6PQA7ADoAc3RhdGVtZW50c19yZXBlYXQxAGRlY2xhcmF0aW9uc19yZXBlYXQxACwACgAAAAAADQAAACUAAAAAAAAAGAAAAAAAAAAyAAAAAgAAAAUAAAAEAAAABQAAADAHAAAAAAAAQAQAANAHAAAgDgAAwA4AAAAFAAAgBQAAYAUAANAFAAAaBgAAIAYAAGAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASQ0AAFwNAACKDQAAXwwAAE0NAABeDQAAWg0AAFkNAABWDQAAygwAAM8MAADkDAAAegwAAE0NAAAPDQAAVA0AAIgNAABSDQAAIQ0AAKQMAAAHDQAAmwwAALsMAAAmDQAANA0AAI4MAADpDAAAgwwAAHAMAAD1DAAAtAwAAK0MAAAADQAAwgwAAFgMAABzDQAAYA0AAAAAAAAAAAAAAAAAAAAAAABlDAAAFQ0AAMoMAABADQAA'));

    for (var i = 0; i<=emit_functions.length-1; i++){
        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = "L"+i;
        document.getElementById('levels').appendChild(opt);
    }
    document.getElementById('levels').value = 2;
    