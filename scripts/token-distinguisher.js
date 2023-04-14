// scripts/token-distinguisher.js
const moduleName = "token-distinguisher";

Hooks.on("canvasReady", async()=>{
    const tokens = canvas.scene.tokens.map(t=>t);
    const grouped = {};
    for(let i = 0; i < tokens.length; i++){
        const tokenDocument = tokens[i];
        const originalName = tokenDocument.flags[moduleName]?.originalName ?? tokenDocument.name;
        if(!grouped[originalName]){
            grouped[originalName] = [tokenDocument];
        }
        else{
            grouped[originalName].push(tokenDocument);
        }
    }
    const groups = Object.keys(grouped);
    for (const groupName of groups){
        const group = grouped[groupName];
        for(let i = 0; i < group.length; i++){
            await setFlags(group[i], groupName, i+1);
        }
        await distinguishGroup(group);
    }
});

Hooks.on("createToken", async (tokenDocument, options, userId) => {
    await distinguishToken(tokenDocument);
});

async function setFlags(document, name, ordinal){
    await document.setFlag(moduleName, "originalName", name);
    await document.setFlag(moduleName, "ordinal", ordinal);
}
async function distinguishGroup(group){
    group.forEach(document=>{
        const originalName = document.flags[moduleName]?.originalName;

        if (group.length > 1) {
            const uniqueName = `${originalName}-${document.flags[moduleName].ordinal}`;
            if(document.name != uniqueName){
                document.update({name:uniqueName});
            }

        }
        else{
            if(document.name != originalName){
                document.update({name:originalName});
            }
        }
    });
}
async function distinguishToken(tokenDocument){
    log("token created", tokenDocument);
    const scene = tokenDocument.parent;
    log("in scene", scene);
    const originalName = tokenDocument.flags[moduleName]?.originalName ?? tokenDocument.name;
    const sameNameTokens = scene.tokens.filter(existingToken => existingToken.flags[moduleName]?.originalName == originalName);

    for(let i =0; i < sameNameTokens.length; i++){
        let ordinal = i + 1;
        if(!sameNameTokens.some(document=>document.flags[moduleName]?.ordinal == ordinal)){
            await setFlags(tokenDocument, originalName, ordinal);
            break;
        }
    }


    await distinguishGroup(sameNameTokens);
}

function log(message, data) {
    if (data) {
        console.log(`${moduleName} | ${message}`, data);
    }
    else {
        console.log(`${moduleName} | ${message}`);
    }
}

function error(message, ex) {
    console.error(`${moduleName} | ${message}`, ex);
}