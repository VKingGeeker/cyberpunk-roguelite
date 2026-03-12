/**
 * 技能管理器
 * 处理技能的学习、升级、触发和冷却
 */

import { Skill, CombatStats, SoundType, ClassType } from '../core/Types';
import { getSkillById, getSkillColor, SKILL_UPGRADE_DATA } from '../data/Skills';
import { EffectManager } from './EffectManager';
import { ClassAbilitySystem } from '../systems/ClassAbilitySystem';
import Drone from '../entities/Drone';
import Phaser from 'phaser';

export class SkillManager {
    private scene: Phaser.Scene;
    private ownedSkills: Map<string, { skill: Skill; cooldownEndTime: number }> = new Map();
    private effectManager: EffectManager;
    private classAbilitySystem: ClassAbilitySystem | null = null;

    constructor(scene: Phaser.Scene, classAbilitySystem?: ClassAbilitySystem) {
        this.scene = scene;
        this.effectManager = new EffectManager(scene);
        this.classAbilitySystem = classAbilitySystem || null;
    }

    /**
     * 设置职业能力系统
     */
    public setClassAbilitySystem(classAbilitySystem: ClassAbilitySystem): void {
        this.classAbilitySystem = classAbilitySystem;
    }

    /**
     * 学习技能
     */
    public learnSkill(skillId: string): void {
        const skillData = getSkillById(skillId);
        if (!skillData) return;

        const skill: Skill = { ...skillData, level: 1, lastUsedTime: 0 };
        this.ownedSkills.set(skillId, { skill, cooldownEndTime: 0 });
    }

    /**
     * 升级技能
     */
    public upgradeSkill(skillId: string): void {
        const owned = this.ownedSkills.get(skillId);
        if (!owned) return;

        const maxLevel = owned.skill.maxLevel || 5;
        if (owned.skill.level >= maxLevel) return;

        owned.skill.level++;
    }

    /**
     * 替换技能
     */
    public replaceSkill(oldSkillId: string, newSkillId: string): void {
        // 移除旧技能
        this.ownedSkills.delete(oldSkillId);
        
        // 学习新技能
        const skillData = getSkillById(newSkillId);
        if (!skillData) return;

        const skill: Skill = { ...skillData, level: 1, lastUsedTime: 0 };
        this.ownedSkills.set(newSkillId, { skill, cooldownEndTime: 0 });
    }

    /**
     * 处理被动技能自动触发
     */
    public handlePassiveSkills(time: number, playerX: number, playerY: number, playerStats: any, enemies: any[]): void {
        // 检查游戏是否暂停
        const gameScene = this.scene as any;
        if (gameScene.getIsPaused && gameScene.getIsPaused()) {
            return;
        }
        
        // 遍历所有已学技能
        this.ownedSkills.forEach((data, skillId) => {
            const { skill, cooldownEndTime } = data;
            
            // 检查冷却
            if (time < cooldownEndTime) return;
            
            // 检查是否有敌人在范围内
            if (enemies.length === 0) return;

            // 触发技能
            this.triggerSkill(skillId, skill, enemies, time, playerX, playerY, playerStats);
        });
    }

    /**
     * 获取已学技能数量（用于调试）
     */
    public getOwnedSkillCount(): number {
        return this.ownedSkills.size;
    }

    /**
     * 触发技能
     * 应用职业能力加成（数据黑客：技能伤害+20%，冷却缩减15%）
     */
    private triggerSkill(skillId: string, skill: Skill, enemies: any[], time: number, playerX: number, playerY: number, playerStats: any): void {
        // 计算冷却时间（根据等级减少）
        const upgradeData = SKILL_UPGRADE_DATA[skillId];
        let cooldownReduction = 0;
        if (upgradeData && skill.level > 1) {
            for (let i = 0; i < skill.level - 1; i++) {
                cooldownReduction += upgradeData[i].cooldownReduction;
            }
        }
        
        // 应用数据黑客冷却缩减
        const classCooldownReduction = this.classAbilitySystem?.getSkillCooldownReduction() || 0;
        const totalCooldownReduction = cooldownReduction + (skill.cooldown * classCooldownReduction);
        const finalCooldown = Math.max(0.5, skill.cooldown - totalCooldownReduction);
        
        // 设置冷却结束时间
        const owned = this.ownedSkills.get(skillId);
        if (owned) {
            owned.cooldownEndTime = time + finalCooldown * 1000;
        }

        // 获取数据黑客技能伤害加成
        const skillDamageBonus = this.classAbilitySystem?.getSkillDamageBonus() || 0;
        const boostedStats = { ...playerStats };
        if (skillDamageBonus > 0) {
            boostedStats.attack = Math.floor(playerStats.attack * (1 + skillDamageBonus));
        }

        // 根据技能类型触发效果
        switch (skillId) {
            case 'skill_neon_slash':
                this.triggerNeonSlash(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_plasma_spin':
                this.triggerPlasmaSpin(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_chain_lightning':
                this.triggerChainLightning(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_laser_beam':
                this.triggerLaserBeam(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_nanobot_shield':
                this.triggerNanobotShield(skill, playerX, playerY);
                break;
            case 'skill_emp_burst':
                this.triggerEmpBurst(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_overdrive':
                this.triggerOverdrive(skill, playerX, playerY);
                break;
            case 'skill_hologram':
                this.triggerHologram(skill, playerX, playerY);
                break;
            case 'skill_void_rift':
                this.triggerVoidRift(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_plasma_orb':
                this.triggerPlasmaOrb(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_nova':
                this.triggerNova(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_sonic_boom':
                this.triggerSonicBoom(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_flame_wave':
                this.triggerFlameWave(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_time_warp':
                this.triggerTimeWarp(skill, enemies, playerX, playerY);
                break;
            case 'skill_nanite_swarm':
                this.triggerNaniteSwarm(skill, playerX, playerY);
                break;
            case 'skill_energy_drain':
                this.triggerEnergyDrain(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_ice_shard':
                this.triggerIceShard(skill, enemies, playerX, playerY, boostedStats);
                break;
            case 'skill_drone':
                this.triggerDrone(skill, playerX, playerY, boostedStats);
                break;
        }
    }

    // 技能触发方法...
    private triggerNeonSlash(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 120);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.8);
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 找到最近的敌人作为斩击方向
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        // 计算斩击方向角度（朝向最近敌人）
        const directionAngle = nearestEnemy 
            ? Phaser.Math.Angle.Between(playerX, playerY, nearestEnemy.enemy.x, nearestEnemy.enemy.y)
            : 0;

        // 获取扇形范围内的敌人
        const nearbyEnemies = enemies.filter(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            return dist < range;
        }).slice(0, 5);

        // 对敌人造成伤害
        nearbyEnemies.forEach(enemy => {
            if (enemy.takeDamage) {
                enemy.takeDamage(damage);
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_SLASH);

        // 播放特效（传递方向角度）
        this.effectManager.createNeonSlashEffect(playerX, playerY, range, directionAngle);
    }

    private triggerPlasmaSpin(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 150);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 2.2);
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 获取范围内的所有敌人
        const nearbyEnemies = enemies.filter(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            return dist < range;
        });

        // 对所有范围内敌人造成伤害
        nearbyEnemies.forEach(enemy => {
            if (enemy.takeDamage) {
                enemy.takeDamage(damage);
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_SPIN);

        // 播放特效
        this.effectManager.createPlasmaSpinEffect(playerX, playerY, range);
    }

    private triggerChainLightning(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 220);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.4);
        const chains = skill.effect?.chains || 4;
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 找到最近的敌人作为起点
        const sortedEnemies = [...enemies].sort((a, b) => {
            const distA = Phaser.Math.Distance.Between(playerX, playerY, a.x, a.y);
            const distB = Phaser.Math.Distance.Between(playerX, playerY, b.x, b.y);
            return distA - distB;
        });

        // 链式攻击
        const chainTargets: { x: number; y: number }[] = [{ x: playerX, y: playerY }];
        let lastPos = { x: playerX, y: playerY };
        let chainCount = 0;

        for (const enemy of sortedEnemies) {
            if (chainCount >= chains) break;
            const dist = Phaser.Math.Distance.Between(lastPos.x, lastPos.y, enemy.x, enemy.y);
            if (dist < range) {
                if (enemy.takeDamage) {
                    enemy.takeDamage(damage);
                }
                chainTargets.push({ x: enemy.x, y: enemy.y });
                lastPos = { x: enemy.x, y: enemy.y };
                chainCount++;
            }
        }
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_LIGHTNING);

        // 播放特效
        if (chainTargets.length > 1) {
            this.effectManager.createChainLightningEffect(chainTargets);
        }
    }

    private triggerLaserBeam(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 300);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.8);
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 找到最近的敌人作为目标方向
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        if (!nearestEnemy) return;

        const angle = Phaser.Math.Angle.Between(playerX, playerY, nearestEnemy.enemy.x, nearestEnemy.enemy.y);

        // 检查激光路径上的敌人
        enemies.forEach(enemy => {
            // 计算敌人到激光线的距离
            const enemyAngle = Phaser.Math.Angle.Between(playerX, playerY, enemy.x, enemy.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);

            // 如果敌人在激光范围内且角度偏差小于0.2弧度
            if (dist < range && angleDiff < 0.2) {
                if (enemy.takeDamage) {
                    enemy.takeDamage(damage);
                }
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_LASER);

        // 播放特效
        this.effectManager.createLaserBeamEffect(playerX, playerY, angle, range);
    }

    private triggerNanobotShield(skill: Skill, playerX: number, playerY: number): void {
        // 护盾效果通过事件通知Player处理
        // 注意：护盾特效的创建和清理都在 Player.onShieldActivated 中统一管理
        // 避免重复创建导致特效无法清理的问题
        this.scene.events.emit('skill-shield-activated', {
            healValue: skill.effect?.healValue || 10,
            duration: skill.effect?.duration || 5
        });
    }

    private triggerEmpBurst(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 160);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.0);
        const stunDuration = skill.effect?.stunDuration || 2;
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 获取范围内的所有敌人
        const nearbyEnemies = enemies.filter(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            return dist < range;
        });

        // 对敌人造成伤害并眩晕
        nearbyEnemies.forEach(enemy => {
            if (enemy.takeDamage) {
                enemy.takeDamage(damage);
            }
            if (enemy.stun) {
                enemy.stun(stunDuration * 1000); // 转换为毫秒
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_EMP);

        // 播放特效
        this.effectManager.createEmpBurstEffect(playerX, playerY, range);
    }

    private triggerOverdrive(skill: Skill, playerX: number, playerY: number): void {
        const speedBoost = skill.effect?.speedBoost || 0.5;
        const duration = skill.effect?.duration || 5;

        // 通过事件通知Player应用速度提升
        this.scene.events.emit('skill-overdrive-activated', {
            speedBoost,
            duration
        });

        // 播放特效
        this.effectManager.createOverdriveEffect(playerX, playerY);
    }

    private triggerHologram(skill: Skill, playerX: number, playerY: number): void {
        const duration = skill.effect?.duration || 4;

        // 通过事件通知创建幻影
        this.scene.events.emit('skill-hologram-activated', {
            x: playerX,
            y: playerY,
            duration
        });

        // 播放特效
        this.effectManager.createHologramEffect(playerX, playerY, duration * 1000);
    }

    /**
     * 虚空裂缝技能 - 持续伤害区域
     * 单次伤害40%，持续4秒共8次tick，总计320%伤害
     */
    private triggerVoidRift(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 140);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.6);
        const duration = skill.effect?.duration || 4;
        
        // 单次伤害为总伤害的1/8（每0.5秒一次，持续4秒）
        const tickDamage = Math.floor(playerStats.attack * damageMultiplier / 8);

        // 找到最近的敌人作为裂缝中心
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        const riftX = nearestEnemy ? nearestEnemy.enemy.x : playerX + 100;
        const riftY = nearestEnemy ? nearestEnemy.enemy.y : playerY;
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_VOID);

        // 创建持续伤害效果
        const tickInterval = 500; // 每0.5秒造成一次伤害
        let tickCount = 0;
        const maxTicks = Math.floor((duration * 1000) / tickInterval);

        const damageTimer = this.scene.time.addEvent({
            delay: tickInterval,
            callback: () => {
                tickCount++;
                
                // 对范围内敌人造成伤害
                enemies.forEach(enemy => {
                    const dist = Phaser.Math.Distance.Between(riftX, riftY, enemy.x, enemy.y);
                    if (dist < range && enemy.takeDamage) {
                        enemy.takeDamage(tickDamage);
                    }
                });

                // 更新特效
                this.effectManager.updateVoidRiftEffect(riftX, riftY, range, tickCount, maxTicks);

                if (tickCount >= maxTicks) {
                    damageTimer.destroy();
                }
            },
            repeat: maxTicks - 1
        });

        // 播放初始特效
        this.effectManager.createVoidRiftEffect(riftX, riftY, range, duration);
    }

    /**
     * 等离子球技能 - AOE范围攻击
     * 追踪最近敌人，命中后产生范围爆炸伤害
     */
    private triggerPlasmaOrb(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 160);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 3.5);
        const explosionRange = skill.effect?.explosionRange || 100;
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 找到最近的敌人
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        if (!nearestEnemy) return;

        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_ORB);

        // 创建追踪等离子球，传入所有敌人列表用于AOE伤害计算
        this.effectManager.createPlasmaOrbEffect(playerX, playerY, nearestEnemy.enemy, damage, range, explosionRange, enemies);
    }

    /**
     * 能量新星技能
     */
    private triggerNova(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 200);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 2.8);
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 对范围内所有敌人造成伤害
        enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (dist < range && enemy.takeDamage) {
                enemy.takeDamage(damage);
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_NOVA);

        // 播放特效
        this.effectManager.createNovaEffect(playerX, playerY, range);
    }

    /**
     * 音爆冲击技能
     */
    private triggerSonicBoom(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 220);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.6);
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 对范围内敌人造成伤害并击退
        enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (dist < range && enemy.takeDamage) {
                enemy.takeDamage(damage);
                // 击退效果
                const angle = Phaser.Math.Angle.Between(playerX, playerY, enemy.x, enemy.y);
                if (enemy.body) {
                    enemy.body.velocity.x += Math.cos(angle) * 200;
                    enemy.body.velocity.y += Math.sin(angle) * 200;
                }
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_BOOM);

        // 播放特效
        this.effectManager.createSonicBoomEffect(playerX, playerY, range);
    }

    /**
     * 烈焰波技能
     */
    private triggerFlameWave(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 200);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.5);
        const duration = skill.effect?.duration || 3;
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 找到最近的敌人作为目标方向
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        const angle = nearestEnemy 
            ? Phaser.Math.Angle.Between(playerX, playerY, nearestEnemy.enemy.x, nearestEnemy.enemy.y)
            : 0;

        // 对扇形范围内敌人造成伤害
        enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            const enemyAngle = Phaser.Math.Angle.Between(playerX, playerY, enemy.x, enemy.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
            
            if (dist < range && angleDiff < Math.PI / 4 && enemy.takeDamage) {
                enemy.takeDamage(damage);
                // 燃烧效果通过事件通知
                this.scene.events.emit('enemy-burn', {
                    enemy,
                    damage: Math.floor(damage * 0.2),
                    duration
                });
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_FLAME);

        // 播放特效
        this.effectManager.createFlameWaveEffect(playerX, playerY, angle, range);
    }

    /**
     * 时间扭曲技能
     */
    private triggerTimeWarp(skill: Skill, enemies: any[], playerX: number, playerY: number): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 220);
        const duration = skill.effect?.duration || 4;

        // 减速范围内敌人60%
        enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (dist < range) {
                // 通过事件通知减速效果
                this.scene.events.emit('enemy-slow', {
                    enemy,
                    slowFactor: 0.4, // 减速60%，保留40%速度
                    duration
                });
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_TIME);

        // 播放特效
        this.effectManager.createTimeWarpEffect(playerX, playerY, range, duration);
    }

    /**
     * 纳米虫群技能
     */
    private triggerNaniteSwarm(skill: Skill, playerX: number, playerY: number): void {
        const healValue = skill.effect?.healValue || 5;
        const damage = skill.effect?.damage || 0.3;
        const duration = skill.effect?.duration || 5;

        // 通过事件通知玩家恢复和伤害效果
        this.scene.events.emit('skill-nanite-swarm-activated', {
            healValue,
            damage,
            duration
        });

        // 播放特效
        this.effectManager.createNaniteSwarmEffect(playerX, playerY, duration);
    }

    /**
     * 能量汲取技能
     */
    private triggerEnergyDrain(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 160);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.3);
        const healValue = skill.effect?.healValue || 20;
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 找到最近的敌人
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        if (nearestEnemy && nearestEnemy.dist < range) {
            // 造成伤害
            if (nearestEnemy.enemy.takeDamage) {
                nearestEnemy.enemy.takeDamage(damage);
            }

            // 恢复生命值
            this.scene.events.emit('player-heal', { healValue });

            // 播放特效
            this.effectManager.createEnergyDrainEffect(playerX, playerY, nearestEnemy.enemy.x, nearestEnemy.enemy.y);
        }
    }

    /**
     * 冰霜碎片技能
     */
    private triggerIceShard(skill: Skill, enemies: any[], playerX: number, playerY: number, playerStats: CombatStats): void {
        const range = this.getUpgradedRange(skill, skill.effect?.range || 220);
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 1.3);
        const duration = skill.effect?.duration || 3;
        const damage = Math.floor(playerStats.attack * damageMultiplier);

        // 找到最近的敌人
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        if (!nearestEnemy) return;

        const angle = Phaser.Math.Angle.Between(playerX, playerY, nearestEnemy.enemy.x, nearestEnemy.enemy.y);

        // 对直线上敌人造成伤害并减速40%
        enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            const enemyAngle = Phaser.Math.Angle.Between(playerX, playerY, enemy.x, enemy.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
            
            if (dist < range && angleDiff < 0.3 && enemy.takeDamage) {
                enemy.takeDamage(damage);
                // 减速效果40%
                this.scene.events.emit('enemy-slow', {
                    enemy,
                    slowFactor: 0.6, // 减速40%，保留60%速度
                    duration
                });
            }
        });
        
        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_ICE);

        // 播放特效
        this.effectManager.createIceShardEffect(playerX, playerY, angle, range);
    }

    /**
     * 无人机召唤技能
     */
    private triggerDrone(skill: Skill, playerX: number, playerY: number, playerStats: CombatStats): void {
        const duration = skill.effect?.duration || 15;
        const damageMultiplier = this.getUpgradedDamage(skill, skill.effect?.damage || 0.8);
        const droneAttack = Math.floor(playerStats.attack * damageMultiplier);

        // 通过事件通知创建无人机
        this.scene.events.emit('skill-drone-activated', {
            x: playerX,
            y: playerY,
            duration,
            attack: droneAttack
        });

        // 播放技能音效
        this.scene.events.emit('play-sound', SoundType.SKILL_ORB);

        console.log(`[SkillManager] 无人机技能已激活，攻击力: ${droneAttack}，持续时间: ${duration}秒`);
    }

    /**
     * 获取升级后的伤害
     */
    private getUpgradedRange(skill: Skill, baseRange: number): number {
        const upgradeData = SKILL_UPGRADE_DATA[skill.id];
        if (!upgradeData || skill.level <= 1) return baseRange;
        
        let rangeBonus = 0;
        for (let i = 0; i < skill.level - 1; i++) {
            rangeBonus += upgradeData[i].rangeBonus;
        }
        return baseRange + rangeBonus;
    }

    /**
     * 获取升级后的伤害
     */
    private getUpgradedDamage(skill: Skill, baseDamage: number): number {
        const upgradeData = SKILL_UPGRADE_DATA[skill.id];
        if (!upgradeData || skill.level <= 1) return baseDamage;
        
        let damageBonus = 0;
        for (let i = 0; i < skill.level - 1; i++) {
            damageBonus += upgradeData[i].damageBonus;
        }
        return baseDamage + damageBonus;
    }

    /**
     * 获取技能等级映射
     */
    public getSkillLevels(): Map<string, number> {
        const levels = new Map<string, number>();
        this.ownedSkills.forEach((data, skillId) => {
            levels.set(skillId, data.skill.level);
        });
        return levels;
    }

    /**
     * 获取已学技能列表
     */
    public getOwnedSkills(): Map<string, { skill: Skill; cooldownEndTime: number }> {
        return this.ownedSkills;
    }

    /**
     * 获取已拥有技能列表
     */
    public getOwnedSkillIds(): string[] {
        return Array.from(this.ownedSkills.keys());
    }

    /**
     * 随机获得一个技能
     */
    public grantRandomSkill(): string {
        const availableSkills = ['skill_neon_slash', 'skill_plasma_spin', 'skill_chain_lightning', 
                                  'skill_laser_beam', 'skill_nanobot_shield', 'skill_emp_burst',
                                  'skill_overdrive', 'skill_hologram'];
        const randomSkillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        this.learnSkill(randomSkillId);
        return randomSkillId;
    }

    /**
     * 获取存档数据
     */
    public getSaveData(): [string, { level: number; cooldownEndTime: number }][] {
        const skillsData: [string, { level: number; cooldownEndTime: number }][] = [];
        this.ownedSkills.forEach((data, skillId) => {
            skillsData.push([skillId, {
                level: data.skill.level,
                cooldownEndTime: data.cooldownEndTime
            }]);
        });
        return skillsData;
    }

    /**
     * 加载存档数据
     */
    public loadSaveData(skillsData: [string, { level: number; cooldownEndTime: number }][] | undefined): void {
        this.ownedSkills.clear();
        
        // 数据验证：检查 skillsData 是否有效
        if (!skillsData || !Array.isArray(skillsData)) {
            console.warn('[SkillManager] loadSaveData: 技能数据无效或为空');
            return;
        }
        
        const currentTime = this.scene.time.now;
        skillsData.forEach(([skillId, data]) => {
            // 验证每个技能数据项
            if (!skillId || !data || typeof data.level !== 'number') {
                console.warn(`[SkillManager] loadSaveData: 跳过无效技能数据项: ${skillId}`);
                return;
            }
            
            const skillData = getSkillById(skillId);
            if (skillData) {
                const skill: Skill = { ...skillData, level: data.level, lastUsedTime: 0 };
                // 检查冷却时间是否已经过期
                const cooldownEndTime = data.cooldownEndTime > currentTime ? data.cooldownEndTime : 0;
                this.ownedSkills.set(skillId, { skill, cooldownEndTime });
            }
        });
    }

    /**
     * 清除所有技能（仅开发环境）
     */
    public clearAllSkills(): void {
        this.ownedSkills.clear();
        console.log('[SkillManager] 已清除所有技能');
    }
}