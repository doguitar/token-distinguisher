class TokenDistinguisher {
    constructor() {
        this.moduleName = "token-distinguisher";

        Hooks.on("init", () => this.init());

        Hooks.on("canvasReady", async () => {
            this.operator = this.getHighestPermissionPlayer();

            if (this.operator?.active && this.operator.id == game.userId) {
                await this.handleCanvasReady();
            }
        });

        Hooks.on("createToken", async (tokenDocument, options, userId) => {
            if (!this.operator?.active) {
                this.operator = this.getHighestPermissionPlayer();
            }
            if (this.operator.id == game.userId) {
                await this.distinguishToken(tokenDocument);
            }
        });
        Hooks.on('updateSettings', (settings, data) => this.updateSettings());

        Hooks.on('createCombatant', async (combat, data, options, userId) => {
            this.log('Create Combatant', [combat, data, options, userId]);
            if (this.combatOnly) {
                await this.distinguishToken(combat.token);
            }
        });

        Hooks.on('deleteCombatant', (combat, data) => {
            this.log('Delete Combatant', [combat, data]);
            if (this.combatOnly) {
                if (combat.token.name != combat.token.flags[this.moduleName]?.originalName) {
                    combat.token.update({ name: combat.token.flags[this.moduleName]?.originalName });
                }
            }
        });
    }

    init() {
        this.log('Initializing TokenDistinguisher', this);

        game.settings.register(this.moduleName, 'useRollTable', {
            name: 'Use Roll Table for Names',
            hint: '',
            scope: 'world', // This setting is specific to a world.
            config: true, // This setting won't appear in the regular settings menu.
            type: Boolean, // The type of the stored value.
            default: false, // The default value for this setting.
            onChange: () => this.debouncedReload()
        });
        game.settings.register(this.moduleName, 'rollTableName', {
            name: 'Roll Table Name',
            hint: '',
            scope: 'world', // This setting is specific to a world.
            config: true, // This setting won't appear in the regular settings menu.
            type: String, // The type of the stored value.
            default: '', // The default value for this setting.
            onChange: () => this.debouncedReload()
        });
        game.settings.register(this.moduleName, 'combatOnly', {
            name: 'In Combat Only',
            hint: '',
            scope: 'world', // This setting is specific to a world.
            config: true, // This setting won't appear in the regular settings menu.
            type: Boolean, // The type of the stored value.
            default: true, // The default value for this setting.
            onChange: () => this.debouncedReload()
        });

        this.updateSettings();
    }

    updateSettings() {
        this.useRollTable = game.settings.get(this.moduleName, 'useRollTable');
        this.rollTableName = game.settings.get(this.moduleName, 'rollTableName');
        this.combatOnly = game.settings.get(this.moduleName, 'combatOnly');

        this.log('Settings Updated', { useRollTable: this.useRollTable, rollTableName: this.rollTableName, combatOnly: this.combatOnly });
    }

    async handleCanvasReady() {
        const tokens = canvas.scene.tokens.map(t => t);
        await this.distinguishTokens(tokens);
    }

    async distinguishTokens(tokens) {
        const grouped = {};
        for (let i = 0; i < tokens.length; i++) {
            const tokenDocument = tokens[i];
            const originalName = this.getOriginalName(tokenDocument) ?? tokenDocument.name;
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
            await this.distinguishGroup(group);
        }
    }
    async distinguishGroup(group) {
        group.forEach(document => {
            const originalName = this.getOriginalName(document);

            if (group.length == 1 || (this.combatOnly && !this.isTokenInCombat(document.id))) {
                if (document.name != originalName) {
                    document.update({ name: originalName });
                }
            }
            else {
                const uniqueName = this.getUniqueName(document);
                if (document.name != uniqueName) {
                    document.update({ name: uniqueName });
                }
            }
        });
    }
    async distinguishToken(tokenDocument) {
        let originalName = this.getOriginalName(tokenDocument);
        const scene = tokenDocument.parent;
        if (!originalName) {
            originalName = tokenDocument.name;
            await this.setOriginalName(tokenDocument, originalName);
        };
        const sameNameTokens = (this.combatOnly ? game.combat.combatants.map(c => c.token) : scene.tokens)
            .filter(existingToken => (this.getOriginalName(existingToken) ?? existingToken.name) == originalName);

        const rollTable = this.useRollTable ? game.tables.find(t => t.name == this.rollTableName) : null;
        const uniqueNames = sameNameTokens.filter(t => this.getUniqueName(t)).map(t => this.getUniqueName(t));
        for (let i = 0; i < sameNameTokens.length; i++) {
            if (this.getUniqueName(sameNameTokens[i])) continue;
            let result;
            let ordinal = 1;
            let uniqueName = '';
            do {
                if (rollTable) {
                    result = (await rollTable.roll()).results[0];
                    uniqueName = `${result.text} ${originalName}`;
                }
                else {
                    uniqueName = `${originalName}-${ordinal}`;
                }
                ordinal += 1;
            } while (uniqueNames.indexOf(uniqueName) > -1 && ordinal < 1000)

            uniqueNames.push(uniqueName);
            await this.setUniqueName(sameNameTokens[i], uniqueName);
        }
        await this.distinguishGroup(sameNameTokens);
    }

    getHighestPermissionPlayer() {
        let highestPermissionPlayer = null;
        let highestPermissionLevel = -1;
        let index = Number.MAX_VALUE;
        let userArray = game.user.collection.map(u => u);
        game.users.forEach((user) => {
            // Check if the user is active (logged in) and has a higher or equal permission level
            if (user.active && user.role >= highestPermissionLevel) {
                // If the user has a higher permission level, update the highestPermissionPlayer and earliestLoginTime
                if (user.role > highestPermissionLevel) {
                    highestPermissionPlayer = user;
                    highestPermissionLevel = user.role;
                    index = userArray.indexOf(user);
                }
                // If the permission level is the same but the user logged in earlier, update the highestPermissionPlayer
                else if (userArray.indexOf(user) < earliestLoginTime) {
                    highestPermissionPlayer = user;
                    index = userArray.indexOf(user);
                }
            }
        });

        return highestPermissionPlayer;
    }

    isTokenInCombat(tokenId) {
        const combat = game.combat;
        if (!combat) {
            return false;
        }

        const combatant = combat.combatants.find(combatant => combatant.tokenId === tokenId);
        return !!combatant;
    }

    async setOriginalName(document, name) {
        await document.setFlag(this.moduleName, "originalName", name);
    }
    getOriginalName(document) {
        return document.flags[this.moduleName]?.originalName;
    }
    async setUniqueName(document, name) {
        await document.setFlag(this.moduleName, "uniqueName", name);
    }
    getUniqueName(document) {
        return document.flags[this.moduleName]?.uniqueName;
    }
    debouncedReload() {
        foundry.utils.debounce(() => {
            window.location.reload();
        }, 100);
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