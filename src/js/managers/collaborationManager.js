class CollaborationManager {
    constructor() {
        this.team = this.loadTeam();
        this.sharedPrompts = this.loadSharedPrompts();
        this.comments = this.loadComments();
        this.permissions = this.loadPermissions();
    }

    loadTeam() {
        const saved = localStorage.getItem('team');
        return saved ? JSON.parse(saved) : [
            {
                id: 'user_1',
                name: 'You',
                email: 'user@example.com',
                role: 'owner',
                avatar: '👤',
                status: 'online',
                lastActive: new Date().toISOString()
            }
        ];
    }

    saveTeam() {
        localStorage.setItem('team', JSON.stringify(this.team));
    }

    loadSharedPrompts() {
        const saved = localStorage.getItem('sharedPrompts');
        return saved ? JSON.parse(saved) : [];
    }

    saveSharedPrompts() {
        localStorage.setItem('sharedPrompts', JSON.stringify(this.sharedPrompts));
    }

    loadComments() {
        const saved = localStorage.getItem('comments');
        return saved ? JSON.parse(saved) : {};
    }

    saveComments() {
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }

    loadPermissions() {
        const saved = localStorage.getItem('permissions');
        return saved ? JSON.parse(saved) : {};
    }

    savePermissions() {
        localStorage.setItem('permissions', JSON.stringify(this.permissions));
    }

    sharePrompt(promptId, userIds, permissions = 'view') {
        const share = {
            id: 'share_' + Date.now(),
            promptId,
            sharedBy: 'user_1',
            sharedWith: userIds,
            permissions,
            sharedAt: new Date().toISOString()
        };

        this.sharedPrompts.push(share);
        this.saveSharedPrompts();

        // Set permissions
        userIds.forEach(userId => {
            if (!this.permissions[userId]) {
                this.permissions[userId] = {};
            }
            this.permissions[userId][promptId] = permissions;
        });
        this.savePermissions();

        return share;
    }

    addComment(promptId, comment) {
        if (!this.comments[promptId]) {
            this.comments[promptId] = [];
        }

        const newComment = {
            id: 'comment_' + Date.now(),
            userId: 'user_1',
            text: comment,
            timestamp: new Date().toISOString(),
            edited: false
        };

        this.comments[promptId].push(newComment);
        this.saveComments();

        return newComment;
    }

    getComments(promptId) {
        return this.comments[promptId] || [];
    }

    addTeamMember(member) {
        const newMember = {
            id: 'user_' + Date.now(),
            ...member,
            status: 'offline',
            lastActive: new Date().toISOString()
        };

        this.team.push(newMember);
        this.saveTeam();

        return newMember;
    }

    removeTeamMember(userId) {
        const index = this.team.findIndex(m => m.id === userId);
        if (index !== -1) {
            this.team.splice(index, 1);
            this.saveTeam();

            // Remove permissions
            delete this.permissions[userId];
            this.savePermissions();

            return true;
        }
        return false;
    }

    updateMemberRole(userId, role) {
        const member = this.team.find(m => m.id === userId);
        if (member) {
            member.role = role;
            this.saveTeam();
            return true;
        }
        return false;
    }

    getSharedWithMe() {
        // In a real app, this would fetch prompts shared with the current user
        return this.sharedPrompts.filter(share =>
            share.sharedWith.includes('user_1')
        );
    }

    getMyShares() {
        return this.sharedPrompts.filter(share =>
            share.sharedBy === 'user_1'
        );
    }
}
