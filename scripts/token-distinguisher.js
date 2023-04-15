class TokenDistinguisher {
    constructor() {
        this.moduleName = "token-distinguisher";
        Hooks.on("canvasReady", async () => {
            await this.handleCanvasReady();
        });

        Hooks.on("createToken", async (tokenDocument, options, userId) => {
            await this.distinguishToken(tokenDocument);
        });
    }

    async handleCanvasReady() {
        const tokens = canvas.scene.tokens.map(t => t);
        const grouped = {};
        for (let i = 0; i < tokens.length; i++) {
            const tokenDocument = tokens[i];
            const originalName = tokenDocument.flags[this.moduleName]?.originalName ?? tokenDocument.name;
            if (!grouped[originalName]) {
                grouped[originalName] = [tokenDocument];
            }
            else {
                grouped[originalName].push(tokenDocument);
            }
        }
        const groups = Object.keys(grouped);
        for (const groupName of groups) {
            const group = grouped[groupName];
            for (let i = 0; i < group.length; i++) {
                await this.setFlags(group[i], groupName, i + 1);
            }
            await this.distinguishGroup(group);
        }
    }

    async setFlags(document, name, ordinal) {
        await document.setFlag(this.moduleName, "originalName", name);
        await document.setFlag(this.moduleName, "ordinal", ordinal);
    }
    async distinguishGroup(group) {
        group.forEach(document => {
            const originalName = document.flags[this.moduleName]?.originalName;

            if (group.length > 1) {
                const uniqueName = `${originalName}-${document.flags[this.moduleName].ordinal}`;
                if (document.name != uniqueName) {
                    document.update({ name: uniqueName });
                }

            }
            else {
                if (document.name != originalName) {
                    document.update({ name: originalName });
                }
            }
        });
    }
    async distinguishToken(tokenDocument) {
        this.log("token created", tokenDocument);
        const scene = tokenDocument.parent;
        this.log("in scene", scene);
        const originalName = tokenDocument.flags[this.moduleName]?.originalName ?? tokenDocument.name;
        const sameNameTokens = scene.tokens.filter(existingToken => existingToken.flags[this.moduleName]?.originalName == originalName);

        for (let i = 0; i < sameNameTokens.length; i++) {
            let ordinal = i + 1;
            if (!sameNameTokens.some(document => document.flags[this.moduleName]?.ordinal == ordinal)) {
                await this.setFlags(tokenDocument, originalName, ordinal);
                break;
            }
        }


        await this.distinguishGroup(sameNameTokens);
    }
    log(message, data) {
        if (data) {
            console.log(`${this.moduleName} | ${message}`, data);
        }
        else {
            console.log(`${this.moduleName} | ${message}`);
        }
    }

    error(message, ex) {
        console.error(`${this.moduleName} | ${message}`, ex);
    }
}
const tokenDistinguisher = new TokenDistinguisher();