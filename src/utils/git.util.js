import { execa } from 'execa';

export const getCurrentGitBranch = async (cwd) => {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
        return stdout.trim();
    } catch (err) {
        return null;
    }
};

export const getCurrentGitCommit = async (cwd) => {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--short', 'HEAD'], { cwd });
        return stdout.trim();
    } catch (err) {
        return null;
    }
};