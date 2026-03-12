/**
 * 特效管理器
 * 处理所有技能和游戏特效
 */

import Phaser from 'phaser';

export class EffectManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 霓虹斩击特效 - 全新设计，流畅的斩击轨迹动画
     * @param x 玩家X坐标
     * @param y 玩家Y坐标
     * @param range 斩击范围
     * @param directionAngle 斩击方向角度（弧度），如果为undefined则朝向最近敌人
     */
    public createNeonSlashEffect(x: number, y: number, range: number, directionAngle?: number): void {
        // 斩击角度范围（相对于方向角度）
        const baseAngle = directionAngle ?? 0;
        const startAngle = baseAngle - Math.PI * 0.35;
        const endAngle = baseAngle + Math.PI * 0.35;
        const arcLength = endAngle - startAngle;

        // ========== 第一阶段：蓄力准备 (0-150ms) ==========
        // 1. 中心能量聚集
        const chargeCore = this.scene.add.graphics();
        chargeCore.fillStyle(0x00ffff, 1);
        chargeCore.fillCircle(x, y, 5);
        chargeCore.setDepth(56);
        
        this.scene.tweens.add({
            targets: chargeCore,
            scaleX: 3,
            scaleY: 3,
            alpha: 0.8,
            duration: 150,
            ease: 'Power2',
            onComplete: () => chargeCore.destroy()
        });

        // 2. 蓄力光环
        const chargeRing = this.scene.add.graphics();
        chargeRing.lineStyle(2, 0x00ffff, 0.6);
        chargeRing.strokeCircle(x, y, 15);
        chargeRing.setDepth(55);
        
        this.scene.tweens.add({
            targets: chargeRing,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 150,
            onComplete: () => chargeRing.destroy()
        });

        // ========== 第二阶段：斩击释放 (150-350ms) ==========
        this.scene.time.delayedCall(150, () => {
            // 3. 流畅的斩击轨迹动画 - 逐帧绘制
            const slashContainer = this.scene.add.container(x, y);
            slashContainer.setDepth(52);
            
            // 创建多个轨迹层
            const trailLayers: Phaser.GameObjects.Graphics[] = [];
            const layerCount = 5;
            
            for (let layer = 0; layer < layerCount; layer++) {
                const trail = this.scene.add.graphics();
                trailLayers.push(trail);
                slashContainer.add(trail);
            }

            // 动画参数
            const slashDuration = 200;
            const frameCount = 20;
            const frameDelay = slashDuration / frameCount;
            let currentFrame = 0;

            // 颜色渐变：青色 -> 紫色 -> 白色
            const getTrailColor = (progress: number, layer: number): number => {
                const baseProgress = progress;
                if (baseProgress < 0.3) {
                    return Phaser.Display.Color.GetColor(
                        0 + baseProgress * 100,
                        255 - baseProgress * 50,
                        255
                    );
                } else if (baseProgress < 0.7) {
                    return Phaser.Display.Color.GetColor(
                        180 + (baseProgress - 0.3) * 200,
                        100 + (baseProgress - 0.3) * 100,
                        255
                    );
                } else {
                    return layer === 0 ? 0xffffff : 0xff66ff;
                }
            };

            // 逐帧绘制动画
            const drawFrame = () => {
                if (currentFrame >= frameCount) {
                    // 动画结束，淡出所有轨迹
                    trailLayers.forEach((trail, index) => {
                        this.scene.tweens.add({
                            targets: trail,
                            alpha: 0,
                            duration: 300 - index * 40,
                            onComplete: () => trail.destroy()
                        });
                    });
                    return;
                }

                const progress = currentFrame / frameCount;
                const currentAngle = startAngle + arcLength * progress;

                // 绘制每一层轨迹
                trailLayers.forEach((trail, layer) => {
                    trail.clear();
                    
                    const layerOffset = layer * 3;
                    const layerAlpha = 1 - layer * 0.15;
                    const layerWidth = 8 - layer * 1.2;
                    const color = getTrailColor(progress, layer);

                    // 主轨迹弧线
                    trail.lineStyle(layerWidth, color, layerAlpha);
                    trail.beginPath();
                    trail.arc(0, 0, range - layerOffset, startAngle, currentAngle, false);
                    trail.strokePath();

                    // 轨迹尾部的渐变效果
                    if (progress > 0.1) {
                        const fadeStart = Math.max(startAngle, currentAngle - 0.3);
                        trail.lineStyle(layerWidth * 0.5, color, layerAlpha * 0.3);
                        trail.beginPath();
                        trail.arc(0, 0, range - layerOffset, fadeStart, currentAngle, false);
                        trail.strokePath();
                    }
                });

                // 在轨迹末端添加能量点（相对于容器坐标）
                if (currentFrame % 3 === 0) {
                    const sparkX = Math.cos(currentAngle) * range;
                    const sparkY = Math.sin(currentAngle) * range;
                    
                    const spark = this.scene.add.circle(0, 0, 4, 0xffffff, 1);
                    spark.setPosition(sparkX, sparkY);
                    spark.setDepth(57);
                    slashContainer.add(spark);

                    this.scene.tweens.add({
                        targets: spark,
                        alpha: 0,
                        scale: 0.3,
                        duration: 150,
                        onComplete: () => spark.destroy()
                    });
                }

                currentFrame++;
                this.scene.time.delayedCall(frameDelay, drawFrame);
            };

            drawFrame();

            // 4. 轨迹残留效果 - 多层拖尾
            for (let i = 0; i < 8; i++) {
                this.scene.time.delayedCall(150 + i * 25, () => {
                    const afterImage = this.scene.add.graphics();
                    const progress = i / 8;
                    const afterAngle = startAngle + arcLength * progress;
                    
                    // 渐变色拖尾
                    const color = getTrailColor(progress, 0);
                    afterImage.lineStyle(4, color, 0.6 - i * 0.06);
                    afterImage.beginPath();
                    afterImage.arc(0, 0, range * (0.85 + i * 0.02), startAngle, afterAngle, false);
                    afterImage.strokePath();
                    afterImage.setDepth(50);
                    slashContainer.add(afterImage);

                    this.scene.tweens.add({
                        targets: afterImage,
                        alpha: 0,
                        scale: 1.15,
                        duration: 350,
                        ease: 'Power2',
                        onComplete: () => afterImage.destroy()
                    });
                });
            }

            // 5. 能量粒子沿轨迹爆发 - 修复：粒子在轨迹范围内扩散，不飞出
            for (let i = 0; i < 45; i++) {
                const delay = 150 + (i / 45) * 200;
                
                this.scene.time.delayedCall(delay, () => {
                    const progress = i / 45;
                    const angle = startAngle + arcLength * progress;
                    const startDist = range * Phaser.Math.FloatBetween(0.2, 0.6);
                    
                    // 粒子颜色渐变
                    const particleColor = getTrailColor(progress, 0);
                    
                    // 创建粒子（使用相对于容器的局部坐标）
                    const particle = this.scene.add.circle(
                        0, 0,
                        Phaser.Math.Between(2, 6),
                        i % 5 === 0 ? 0xffffff : particleColor,
                        1
                    );
                    // 设置相对于容器的初始位置
                    particle.setPosition(
                        Math.cos(angle) * startDist,
                        Math.sin(angle) * startDist
                    );
                    particle.setDepth(55);
                    slashContainer.add(particle);

                    // 粒子向中心收缩并消失，而不是向外飞出
                    this.scene.tweens.add({
                        targets: particle,
                        x: Math.cos(angle) * range * 0.1,
                        y: Math.sin(angle) * range * 0.1,
                        alpha: 0,
                        scale: 0.2,
                        duration: Phaser.Math.Between(200, 350),
                        ease: 'Power2',
                        onComplete: () => particle.destroy()
                    });
                });
            }

            // 6. 核心能量爆发
            const coreBurst = this.scene.add.graphics();
            coreBurst.fillStyle(0xffffff, 1);
            coreBurst.fillCircle(0, 0, 30);
            coreBurst.setDepth(58);
            slashContainer.add(coreBurst);

            this.scene.tweens.add({
                targets: coreBurst,
                alpha: 0,
                scale: 2.5,
                duration: 250,
                ease: 'Power2',
                onComplete: () => coreBurst.destroy()
            });

            // 7. 冲击波效果
            for (let i = 0; i < 3; i++) {
                this.scene.time.delayedCall(200 + i * 80, () => {
                    const shockwave = this.scene.add.graphics();
                    shockwave.lineStyle(4 - i, 0x00ffff, 0.7 - i * 0.15);
                    shockwave.beginPath();
                    shockwave.arc(0, 0, range * (0.3 + i * 0.1), startAngle, endAngle, false);
                    shockwave.strokePath();
                    shockwave.setDepth(48);
                    slashContainer.add(shockwave);

                    this.scene.tweens.add({
                        targets: shockwave,
                        scaleX: 2.5,
                        scaleY: 2.5,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => shockwave.destroy()
                    });
                });
            }

            // 8. 外发光效果
            const outerGlow = this.scene.add.graphics();
            outerGlow.lineStyle(20, 0x00ffff, 0.25);
            outerGlow.beginPath();
            outerGlow.arc(0, 0, range, startAngle, endAngle, false);
            outerGlow.strokePath();
            outerGlow.setDepth(46);
            slashContainer.add(outerGlow);

            this.scene.tweens.add({
                targets: outerGlow,
                alpha: 0,
                scale: 1.3,
                duration: 600,
                onComplete: () => outerGlow.destroy()
            });

            // 9. 范围指示器
            const rangeIndicator = this.scene.add.graphics();
            rangeIndicator.lineStyle(2, 0x00ffff, 0.35);
            rangeIndicator.fillStyle(0x00ffff, 0.08);
            rangeIndicator.beginPath();
            rangeIndicator.arc(0, 0, range, startAngle, endAngle, false);
            rangeIndicator.lineTo(0, 0);
            rangeIndicator.closePath();
            rangeIndicator.fillPath();
            rangeIndicator.strokePath();
            rangeIndicator.setDepth(47);
            slashContainer.add(rangeIndicator);

            this.scene.tweens.add({
                targets: rangeIndicator,
                alpha: 0,
                duration: 700,
                onComplete: () => rangeIndicator.destroy()
            });

            // 10. 屏幕效果
            this.scene.cameras.main.shake(200, 0.03);

            // 11. 能量涟漪
            for (let i = 0; i < 4; i++) {
                this.scene.time.delayedCall(250 + i * 100, () => {
                    const ripple = this.scene.add.graphics();
                    ripple.lineStyle(2, 0x00ffff, 0.5 - i * 0.1);
                    ripple.strokeCircle(0, 0, range * 0.4);
                    ripple.setDepth(49);
                    slashContainer.add(ripple);

                    this.scene.tweens.add({
                        targets: ripple,
                        scaleX: 2.5,
                        scaleY: 2.5,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => ripple.destroy()
                    });
                });
            }

            // 12. 斩击完成时的能量残留
            this.scene.time.delayedCall(350, () => {
                // 残留能量线
                for (let i = 0; i < 5; i++) {
                    const residualLine = this.scene.add.graphics();
                    const angle = startAngle + (arcLength * i) / 4;
                    
                    residualLine.lineStyle(2, 0xff66ff, 0.5);
                    residualLine.moveTo(0, 0);
                    residualLine.lineTo(
                        Math.cos(angle) * range * 0.8,
                        Math.sin(angle) * range * 0.8
                    );
                    residualLine.strokePath();
                    residualLine.setDepth(45);
                    slashContainer.add(residualLine);

                    this.scene.tweens.add({
                        targets: residualLine,
                        alpha: 0,
                        duration: 400,
                        delay: i * 30,
                        onComplete: () => residualLine.destroy()
                    });
                }
            });
        });
    }

    /**
     * 等离子漩涡特效 - 炫酷版
     */
    public createPlasmaSpinEffect(x: number, y: number, range: number): void {
        // 多层旋转光环
        const layers = [
            { radius: range * 0.5, color: 0xff00ff, alpha: 0.9, width: 4 },
            { radius: range * 0.7, color: 0xff44ff, alpha: 0.7, width: 5 },
            { radius: range * 0.9, color: 0xff88ff, alpha: 0.5, width: 6 },
            { radius: range * 1.1, color: 0xffaaff, alpha: 0.3, width: 7 }
        ];

        layers.forEach((layer, index) => {
            const ring = this.scene.add.graphics();
            ring.lineStyle(layer.width, layer.color, layer.alpha);
            ring.strokeCircle(x, y, layer.radius);
            ring.setDepth(50);

            this.scene.tweens.add({
                targets: ring,
                rotation: Math.PI * 4 * (index % 2 === 0 ? 1 : -1),
                alpha: 0,
                scale: 1.8,
                duration: 600,
                onComplete: () => ring.destroy()
            });
        });

        // 中心爆发
        const burst = this.scene.add.graphics();
        burst.fillStyle(0xff00ff, 0.8);
        burst.fillCircle(x, y, 30);
        
        this.scene.tweens.add({
            targets: burst,
            alpha: 0,
            scale: 5,
            duration: 500,
            onComplete: () => burst.destroy()
        });

        // 能量线条向外扩散
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const line = this.scene.add.graphics();
            line.lineStyle(3, 0xff00ff, 0.9);
            line.moveTo(x, y);
            line.lineTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
            line.strokePath();

            this.scene.tweens.add({
                targets: line,
                scaleX: range / 10,
                scaleY: range / 10,
                alpha: 0,
                duration: 400,
                delay: i * 10,
                onComplete: () => line.destroy()
            });
        }

        // 粒子风暴
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const distance = Phaser.Math.Between(20, range);
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                Phaser.Math.Between(2, 6),
                Phaser.Math.Between(0, 1) === 0 ? 0xff00ff : 0x00ffff,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: x,
                y: y,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(300, 600),
                delay: Phaser.Math.Between(0, 100),
                onComplete: () => particle.destroy()
            });
        }

        this.scene.cameras.main.shake(200, 0.03);
    }

    /**
     * 连锁闪电特效 - 炫酷版
     */
    public createChainLightningEffect(positions: { x: number; y: number }[]): void {
        // 绘制闪电路径
        for (let i = 0; i < positions.length - 1; i++) {
            const startX = positions[i].x;
            const startY = positions[i].y;
            const endX = positions[i + 1].x;
            const endY = positions[i + 1].y;

            // 主闪电
            const lightning = this.scene.add.graphics();
            lightning.lineStyle(4, 0xffff00, 1);
            
            // 绘制锯齿状闪电
            const segments = 10;
            lightning.moveTo(startX, startY);
            
            for (let j = 1; j < segments; j++) {
                const t = j / segments;
                const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 30;
                const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 30;
                lightning.lineTo(x, y);
            }
            lightning.lineTo(endX, endY);
            lightning.strokePath();

            // 外发光
            const glow = this.scene.add.graphics();
            glow.lineStyle(8, 0xffff00, 0.3);
            glow.moveTo(startX, startY);
            for (let j = 1; j < segments; j++) {
                const t = j / segments;
                const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 30;
                const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 30;
                glow.lineTo(x, y);
            }
            glow.lineTo(endX, endY);
            glow.strokePath();

            // 击中点爆发
            const burst = this.scene.add.graphics();
            burst.fillStyle(0xffffff, 1);
            burst.fillCircle(endX, endY, 15);
            
            this.scene.tweens.add({
                targets: burst,
                alpha: 0,
                scale: 3,
                duration: 200,
                onComplete: () => burst.destroy()
            });

            this.scene.tweens.add({
                targets: [lightning, glow],
                alpha: 0,
                duration: 300,
                delay: i * 100,
                onComplete: () => {
                    lightning.destroy();
                    glow.destroy();
                }
            });
        }

        // 闪光效果
        this.scene.cameras.main.flash(100, 255, 255, 0, false, undefined, this.scene);
    }

    /**
     * 激光射线特效 - 炫酷版
     */
    public createLaserBeamEffect(x: number, y: number, angle: number, range: number): void {
        const endX = x + Math.cos(angle) * range;
        const endY = y + Math.sin(angle) * range;

        // 主激光
        const laser = this.scene.add.graphics();
        laser.lineStyle(6, 0xff4400, 1);
        laser.moveTo(x, y);
        laser.lineTo(endX, endY);
        laser.strokePath();

        // 外发光
        const glow1 = this.scene.add.graphics();
        glow1.lineStyle(12, 0xff4400, 0.4);
        glow1.moveTo(x, y);
        glow1.lineTo(endX, endY);
        glow1.strokePath();

        const glow2 = this.scene.add.graphics();
        glow2.lineStyle(20, 0xff6600, 0.2);
        glow2.moveTo(x, y);
        glow2.lineTo(endX, endY);
        glow2.strokePath();

        // 起点爆发
        const startBurst = this.scene.add.graphics();
        startBurst.fillStyle(0xffffff, 1);
        startBurst.fillCircle(x, y, 20);
        
        this.scene.tweens.add({
            targets: startBurst,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => startBurst.destroy()
        });

        // 终点爆发
        const endBurst = this.scene.add.graphics();
        endBurst.fillStyle(0xff4400, 1);
        endBurst.fillCircle(endX, endY, 25);
        
        this.scene.tweens.add({
            targets: endBurst,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => endBurst.destroy()
        });

        // 激光拖尾粒子
        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const px = x + (endX - x) * t;
            const py = y + (endY - y) * t;
            
            const particle = this.scene.add.circle(
                px + (Math.random() - 0.5) * 20,
                py + (Math.random() - 0.5) * 20,
                Phaser.Math.Between(3, 8),
                0xff6600,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 30,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(200, 400),
                delay: i * 10,
                onComplete: () => particle.destroy()
            });
        }

        this.scene.tweens.add({
            targets: [laser, glow1, glow2],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                laser.destroy();
                glow1.destroy();
                glow2.destroy();
            }
        });

        this.scene.cameras.main.shake(100, 0.02);
    }

    /**
     * 纳米护盾特效 - 重新设计，清晰的视觉反馈
     * 包含：激活展开动画、持续护盾效果、受损反馈、破碎特效
     * @returns 返回护盾特效容器，调用方需要在护盾结束时销毁
     */
    public createShieldEffect(x: number, y: number): Phaser.GameObjects.Container {
        const shieldRadius = 45;
        const container = this.scene.add.container(x, y);
        container.setDepth(100); // 确保护盾在玩家上层

        // ========== 第一阶段：激活展开 (0-400ms) ==========

        // 1. 核心能量爆发 - 短暂特效，自动销毁
        const core = this.scene.add.graphics();
        core.fillStyle(0x44ff44, 1);
        core.fillCircle(0, 0, 8);
        container.add(core);

        this.scene.tweens.add({
            targets: core,
            scale: 4,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                core.destroy();
            }
        });

        // 2. 护盾圆环展开 - 持续存在的护盾环
        const shieldRing = this.scene.add.graphics();
        shieldRing.lineStyle(3, 0x44ff44, 1);
        shieldRing.strokeCircle(0, 0, shieldRadius);
        container.add(shieldRing);

        // 3. 护盾填充 - 持续存在的护盾填充
        const shieldFill = this.scene.add.graphics();
        shieldFill.fillStyle(0x44ff44, 0.15);
        shieldFill.fillCircle(0, 0, shieldRadius);
        shieldFill.setAlpha(0);
        container.add(shieldFill);

        // 护盾填充淡入
        this.scene.tweens.add({
            targets: shieldFill,
            alpha: 1,
            duration: 300,
            delay: 200
        });

        // 4. 能量粒子爆发 - 短暂特效，自动销毁
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const particle = this.scene.add.graphics();
            particle.fillStyle(0x88ff88, 1);
            particle.fillCircle(0, 0, 3);
            container.add(particle);

            this.scene.tweens.add({
                targets: particle,
                x: Math.cos(angle) * shieldRadius,
                y: Math.sin(angle) * shieldRadius,
                alpha: 0,
                duration: 500,
                delay: i * 20,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // 5. 外圈波纹 - 短暂特效，自动销毁
        const ripple = this.scene.add.graphics();
        ripple.lineStyle(2, 0x44ff44, 0.8);
        ripple.strokeCircle(0, 0, shieldRadius);
        container.add(ripple);

        this.scene.tweens.add({
            targets: ripple,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 600,
            delay: 100,
            ease: 'Power2',
            onComplete: () => {
                ripple.destroy();
            }
        });

        // 6. 屏幕震动反馈
        this.scene.cameras.main.shake(150, 0.005);

        // 7. 屏幕闪光
        this.scene.cameras.main.flash(200, 68, 255, 68, false, undefined, this.scene);

        // 保存护盾核心元素的引用，以便后续销毁
        (container as any).shieldData = {
            shieldRing,
            shieldFill,
            radius: shieldRadius
        };

        return container;
    }

    /**
     * 护盾受损特效
     * 注意：不再调用 updateShieldDisplay，因为护盾特效容器已经持续存在
     */
    public createShieldDamageEffect(x: number, y: number, shieldPoints: number, maxShieldPoints: number): void {
        const percentage = shieldPoints / maxShieldPoints;
        const shieldRadius = 45;

        // 受损波纹
        const damageWave = this.scene.add.graphics();
        damageWave.lineStyle(4, 0xff4444, 1);
        damageWave.strokeCircle(x, y, shieldRadius);
        this.scene.add.existing(damageWave);

        this.scene.tweens.add({
            targets: damageWave,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                damageWave.destroy();
            }
        });

        // 火花粒子
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
            const spark = this.scene.add.graphics();
            spark.fillStyle(0xffff44, 1);
            spark.fillCircle(0, 0, 2 + Math.random() * 2);
            spark.setPosition(x, y);
            this.scene.add.existing(spark);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                alpha: 0,
                scale: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    spark.destroy();
                }
            });
        }

        // 屏幕红色闪烁
        this.scene.cameras.main.flash(100, 255, 68, 68, false, undefined, this.scene);

        // 注意：不再创建额外的护盾显示圆圈
        // 护盾特效容器已经在 createShieldEffect 中创建并持续存在
    }

    /**
     * 护盾破碎特效
     */
    public createShieldBreakEffect(x: number, y: number): void {
        const shieldRadius = 45;

        // 1. 破碎波纹
        for (let i = 0; i < 3; i++) {
            const wave = this.scene.add.graphics();
            wave.lineStyle(4 - i, 0xff4444, 1 - i * 0.3);
            wave.strokeCircle(x, y, shieldRadius);
            this.scene.add.existing(wave);

            this.scene.tweens.add({
                targets: wave,
                scaleX: 1.5 + i * 0.3,
                scaleY: 1.5 + i * 0.3,
                alpha: 0,
                duration: 400,
                delay: i * 80,
                ease: 'Power2',
                onComplete: () => wave.destroy()
            });
        }

        // 2. 碎片粒子
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const distance = 20 + Math.random() * 40;
            const speed = 100 + Math.random() * 150;

            const fragment = this.scene.add.graphics();
            fragment.fillStyle(0x44ff44, 1);
            fragment.fillCircle(0, 0, 2 + Math.random() * 3);
            fragment.setPosition(x, y);
            this.scene.add.existing(fragment);

            this.scene.tweens.add({
                targets: fragment,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => fragment.destroy()
            });
        }

        // 3. 屏幕强烈震动
        this.scene.cameras.main.shake(200, 0.01);

        // 4. 屏幕变红闪烁
        this.scene.cameras.main.flash(300, 255, 68, 68, false, undefined, this.scene);
    }

    /**
     * EMP冲击波特效
     */
    public createEmpBurstEffect(x: number, y: number, range: number): void {
        // EMP波纹
        for (let i = 0; i < 3; i++) {
            const wave = this.scene.add.graphics();
            wave.lineStyle(4 - i, 0x4488ff, 1 - i * 0.2);
            wave.strokeCircle(x, y, 10);

            this.scene.tweens.add({
                targets: wave,
                scale: range / 10,
                alpha: 0,
                duration: 500,
                delay: i * 100,
                onComplete: () => wave.destroy()
            });
        }

        // 电磁粒子
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const particle = this.scene.add.circle(
                x,
                y,
                5,
                0x4488ff,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * range,
                y: y + Math.sin(angle) * range,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        this.scene.cameras.main.flash(150, 68, 136, 255, false, undefined, this.scene);
    }

    /**
     * 超频驱动特效
     */
    public createOverdriveEffect(x: number, y: number): void {
        // 速度线
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const line = this.scene.add.graphics();
            line.lineStyle(2, 0xff8800, 0.8);
            line.moveTo(x, y);
            line.lineTo(x - Math.cos(angle) * 50, y - Math.sin(angle) * 50);
            line.strokePath();

            this.scene.tweens.add({
                targets: line,
                alpha: 0,
                duration: 300,
                delay: i * 30,
                onComplete: () => line.destroy()
            });
        }
    }

    /**
     * 全息幻影特效
     */
    public createHologramEffect(x: number, y: number, duration: number): void {
        const hologram = this.scene.add.image(x, y, 'player_idle');
        hologram.setAlpha(0.5);
        hologram.setTint(0x00ffff);
        hologram.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: hologram,
            alpha: 0.2,
            duration: 500,
            yoyo: true,
            repeat: Math.floor(duration / 1000)
        });

        this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
                targets: hologram,
                alpha: 0,
                duration: 300,
                onComplete: () => hologram.destroy()
            });
        });
    }

    /**
     * 显示伤害数字
     */
    public showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
        const text = this.scene.add.text(x, y - 20, damage.toString(), {
            fontSize: isCrit ? '28px' : '20px',
            fontStyle: 'bold',
            color: isCrit ? '#ffff00' : '#ffffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.scene.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示学习技能文字
     */
    public showSkillLearnedText(x: number, y: number, skillName: string, color: number): void {
        const text = this.scene.add.text(x, y - 60, `习得新技能: ${skillName}`, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示升级技能文字
     */
    public showSkillUpgradedText(x: number, y: number, skillName: string, level: number, color: number): void {
        const text = this.scene.add.text(x, y - 60, `${skillName} → Lv.${level}`, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示技能替换文字
     */
    public showSkillReplacedText(x: number, y: number, oldSkillName: string, newSkillName: string, color: number): void {
        const text = this.scene.add.text(x, y - 60, `技能替换: ${oldSkillName} → ${newSkillName}`, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示升级特效
     */
    public showLevelUpEffect(x: number, y: number, level: number): void {
        // 升级光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(4, 0xffff00, 1);
        ring.strokeCircle(x, y, 20);

        this.scene.tweens.add({
            targets: ring,
            scale: 5,
            alpha: 0,
            duration: 800,
            onComplete: () => ring.destroy()
        });

        // 升级文字
        const text = this.scene.add.text(x, y - 50, `LEVEL UP! Lv.${level}`, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // 粒子爆发
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const particle = this.scene.add.circle(
                x,
                y,
                4,
                Phaser.Math.Between(0, 1) === 0 ? 0xffff00 : 0xff8800,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 80,
                y: y + Math.sin(angle) * 80,
                alpha: 0,
                scale: 0,
                duration: 600,
                delay: i * 20,
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * 显示提升效果
     */
    public showBoostEffect(x: number, y: number, type: string, value: number): void {
        const colors: Record<string, number> = {
            attack: 0xff4444,
            defense: 0x4444ff,
            speed: 0xffff44,
            crit: 0xff44ff
        };

        const names: Record<string, string> = {
            attack: '攻击力',
            defense: '防御力',
            speed: '速度',
            crit: '暴击率'
        };

        const text = this.scene.add.text(x, y - 40, `${names[type]} ↑`, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${(colors[type] || 0xffffff).toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.scene.tweens.add({
            targets: text,
            y: y - 70,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示武器装备特效
     */
    public showWeaponEquipEffect(weapon: any, x: number, y: number): void {
        const rarityColors: Record<string, number> = {
            'common': 0x888888,
            'rare': 0x4488ff,
            'epic': 0xaa44ff,
            'legendary': 0xffaa00
        };

        const color = rarityColors[weapon.rarity] || 0xffffff;
        
        const text = this.scene.add.text(x, y - 50, `装备: ${weapon.name}`, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: y - 90,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // 武器光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, color, 0.8);
        ring.strokeCircle(x, y, 30);

        this.scene.tweens.add({
            targets: ring,
            scale: 2,
            alpha: 0,
            duration: 600,
            onComplete: () => ring.destroy()
        });
    }

    /**
     * 显示武器切换特效
     */
    public showWeaponSwitchEffect(x: number, y: number): void {
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.3);
        flash.fillRect(x - 20, y - 20, 40, 40);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    /**
     * 虚空裂缝特效 - 增强版，包含明显的范围指示器
     */
    public createVoidRiftEffect(x: number, y: number, range: number, duration: number): void {
        // 创建裂缝容器 - 所有元素都相对于此容器使用局部坐标
        const riftContainer = this.scene.add.container(x, y);
        riftContainer.setDepth(60);

        // 1. 外层范围指示器 - 脉冲圆环（使用局部坐标 0,0）
        const rangeIndicator = this.scene.add.graphics();
        rangeIndicator.lineStyle(3, 0x8800ff, 0.8);
        rangeIndicator.strokeCircle(0, 0, range);
        rangeIndicator.fillStyle(0x8800ff, 0.15);
        rangeIndicator.fillCircle(0, 0, range);
        riftContainer.add(rangeIndicator);

        // 范围指示器脉冲动画
        this.scene.tweens.add({
            targets: rangeIndicator,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 0.6,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 2. 虚空裂缝核心 - 扭曲的多边形（使用局部坐标）
        const riftCore = this.scene.add.graphics();
        riftCore.fillStyle(0x4400aa, 0.9);
        const sides = 6;
        riftCore.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const radius = 25 + Math.sin(i * 2) * 5;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) riftCore.moveTo(px, py);
            else riftCore.lineTo(px, py);
        }
        riftCore.closePath();
        riftCore.fillPath();
        riftContainer.add(riftCore);

        // 裂缝核心旋转动画
        this.scene.tweens.add({
            targets: riftCore,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1
        });

        // 3. 内部能量漩涡（使用局部坐标 0,0）
        const vortex = this.scene.add.graphics();
        vortex.lineStyle(2, 0xaa44ff, 0.8);
        for (let i = 0; i < 3; i++) {
            const radius = 10 + i * 8;
            vortex.strokeCircle(0, 0, radius);
        }
        riftContainer.add(vortex);

        // 漩涡反向旋转
        this.scene.tweens.add({
            targets: vortex,
            rotation: -Math.PI * 4,
            duration: 2000,
            repeat: -1
        });

        // 4. 虚空能量光束 - 从中心向外延伸（使用局部坐标）
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            // 创建光束容器，用于正确设置旋转中心
            const beamContainer = this.scene.add.container(0, 0);
            beamContainer.setRotation(angle);
            riftContainer.add(beamContainer);
            
            const beam = this.scene.add.graphics();
            beam.fillStyle(0x8800ff, 0.6);
            // 从中心向外绘制矩形
            beam.fillRect(-3, -60, 6, 60);
            beamContainer.add(beam);

            this.scene.tweens.add({
                targets: beam,
                scaleY: 1.5,
                alpha: 0.3,
                duration: 400,
                yoyo: true,
                repeat: -1,
                delay: i * 100
            });
        }

        // 5. 虚空粒子 - 持续从裂缝中涌出（使用相对于容器的局部坐标）
        const particleTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * range * 0.8;
                // 创建粒子（相对于容器的局部坐标）
                const particle = this.scene.add.circle(
                    0, 0,
                    Phaser.Math.Between(2, 5),
                    Phaser.Math.Between(0, 1) === 0 ? 0x8800ff : 0xaa44ff,
                    0.8
                );
                // 设置相对于容器的初始位置
                particle.setPosition(
                    Math.cos(angle) * 10,
                    Math.sin(angle) * 10
                );
                particle.setDepth(61);
                riftContainer.add(particle);

                this.scene.tweens.add({
                    targets: particle,
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    alpha: 0,
                    scale: 0.3,
                    duration: Phaser.Math.Between(400, 800),
                    onComplete: () => particle.destroy()
                });
            },
            repeat: -1
        });

        // 6. 裂缝边缘的闪电效果（使用相对于容器的坐标）
        const lightningTimer = this.scene.time.addEvent({
            delay: 200,
            callback: () => {
                const lightning = this.scene.add.graphics();
                lightning.lineStyle(2, 0xffffff, 0.9);
                const startAngle = Math.random() * Math.PI * 2;
                lightning.moveTo(Math.cos(startAngle) * 20, Math.sin(startAngle) * 20);
                
                // 锯齿状闪电
                for (let i = 0; i < 5; i++) {
                    const t = (i + 1) / 5;
                    const angle = startAngle + (Math.random() - 0.5) * 0.5;
                    const dist = 20 + t * (range - 20);
                    lightning.lineTo(
                        Math.cos(angle) * dist + (Math.random() - 0.5) * 15,
                        Math.sin(angle) * dist + (Math.random() - 0.5) * 15
                    );
                }
                lightning.strokePath();
                lightning.setDepth(62);
                riftContainer.add(lightning);

                this.scene.tweens.add({
                    targets: lightning,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => lightning.destroy()
                });
            },
            repeat: -1
        });

        // 7. 初始爆发效果（使用相对于容器的坐标 0,0）
        const burst = this.scene.add.graphics();
        burst.fillStyle(0xffffff, 1);
        burst.fillCircle(0, 0, 40);
        burst.setDepth(63);
        riftContainer.add(burst);

        this.scene.tweens.add({
            targets: burst,
            alpha: 0,
            scale: 3,
            duration: 400,
            onComplete: () => burst.destroy()
        });

        // 屏幕闪烁
        this.scene.cameras.main.flash(200, 136, 0, 255, false, undefined, this.scene);

        // 存储定时器引用以便清理
        riftContainer.setData('particleTimer', particleTimer);
        riftContainer.setData('lightningTimer', lightningTimer);

        // 持续时间结束后销毁
        this.scene.time.delayedCall(duration * 1000, () => {
            particleTimer.destroy();
            lightningTimer.destroy();
            
            // 淡出动画
            this.scene.tweens.add({
                targets: riftContainer,
                alpha: 0,
                scale: 1.5,
                duration: 500,
                onComplete: () => riftContainer.destroy()
            });
        });
    }

    /**
     * 更新虚空裂缝特效 - 每次伤害tick时调用
     */
    public updateVoidRiftEffect(x: number, y: number, range: number, tickCount: number, maxTicks: number): void {
        // 伤害脉冲效果
        const pulse = this.scene.add.graphics();
        pulse.lineStyle(4, 0xff00ff, 0.8);
        pulse.strokeCircle(x, y, range * 0.5);
        pulse.setDepth(59);

        this.scene.tweens.add({
            targets: pulse,
            scaleX: range / (range * 0.5) * 1.2,
            scaleY: range / (range * 0.5) * 1.2,
            alpha: 0,
            duration: 300,
            onComplete: () => pulse.destroy()
        });

        // 伤害数字提示
        if (tickCount % 2 === 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * range * 0.7;
            this.showDamageNumber(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                Math.floor(Math.random() * 50 + 30),
                false
            );
        }
    }

    /**
     * 等离子球特效 - 追踪效果 + AOE范围爆炸
     */
    public createPlasmaOrbEffect(
        x: number,
        y: number,
        target: any,
        damage: number,
        range: number,
        explosionRange: number = 100,
        allEnemies: any[] = []
    ): void {
        // 创建容器来管理所有特效元素
        const orbContainer = this.scene.add.container(x, y);
        orbContainer.setDepth(55);

        // 等离子球主体
        const orb = this.scene.add.circle(0, 0, 15, 0xff66ff, 1);
        orb.setDepth(3);
        orbContainer.add(orb);

        // 外层光晕
        const glow = this.scene.add.circle(0, 0, 22, 0xff66ff, 0.4);
        glow.setDepth(2);
        orbContainer.add(glow);

        // 内部高光
        const innerGlow = this.scene.add.circle(0, 0, 8, 0xffffff, 0.8);
        innerGlow.setDepth(4);
        orbContainer.add(innerGlow);

        // 能量环效果
        const energyRing = this.scene.add.circle(0, 0, 25, 0xff66ff, 0.2);
        energyRing.setDepth(1);
        orbContainer.add(energyRing);

        // 追踪动画
        const moveSpeed = 300;
        const updateInterval = 16;
        let hasExploded = false;

        const moveTimer = this.scene.time.addEvent({
            delay: updateInterval,
            callback: () => {
                if (hasExploded) return;

                if (!target || !target.active) {
                    // 目标消失，在当前位置爆炸
                    hasExploded = true;
                    this.createPlasmaOrbExplosionAOE(orbContainer.x, orbContainer.y, damage, explosionRange, allEnemies);
                    this.cleanupPlasmaOrb(orbContainer, moveTimer, trailTimer, pulseTween);
                    return;
                }

                const dist = Phaser.Math.Distance.Between(orbContainer.x, orbContainer.y, target.x, target.y);

                if (dist < 20) {
                    // 击中目标，触发AOE爆炸
                    hasExploded = true;
                    this.createPlasmaOrbExplosionAOE(orbContainer.x, orbContainer.y, damage, explosionRange, allEnemies);
                    this.cleanupPlasmaOrb(orbContainer, moveTimer, trailTimer, pulseTween);
                } else {
                    // 继续追踪
                    const angle = Phaser.Math.Angle.Between(orbContainer.x, orbContainer.y, target.x, target.y);
                    const moveDistance = moveSpeed * (updateInterval / 1000);
                    orbContainer.x += Math.cos(angle) * moveDistance;
                    orbContainer.y += Math.sin(angle) * moveDistance;
                }
            },
            repeat: -1
        });

        // 脉冲效果
        const pulseTween = this.scene.tweens.add({
            targets: [glow, energyRing],
            scale: 1.4,
            alpha: 0.1,
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        // 旋转效果
        this.scene.tweens.add({
            targets: energyRing,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1
        });

        // 拖尾粒子
        const trailTimer = this.scene.time.addEvent({
            delay: 40,
            callback: () => {
                if (hasExploded || !orbContainer.active) return;
                const trail = this.scene.add.circle(orbContainer.x, orbContainer.y, 6, 0xff66ff, 0.5);
                trail.setDepth(54);
                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.2,
                    duration: 250,
                    onComplete: () => {
                        if (trail.active) trail.destroy();
                    }
                });
            },
            repeat: -1
        });

        // 最大飞行时间限制（防止球体无限飞行）
        this.scene.time.delayedCall(5000, () => {
            if (!hasExploded && orbContainer.active) {
                hasExploded = true;
                this.createPlasmaOrbExplosionAOE(orbContainer.x, orbContainer.y, damage, explosionRange, allEnemies);
                this.cleanupPlasmaOrb(orbContainer, moveTimer, trailTimer, pulseTween);
            }
        });

        // 存储引用
        orbContainer.setData('moveTimer', moveTimer);
        orbContainer.setData('trailTimer', trailTimer);
        orbContainer.setData('pulseTween', pulseTween);
    }

    /**
     * 清理等离子球所有元素
     */
    private cleanupPlasmaOrb(
        container: Phaser.GameObjects.Container,
        moveTimer: Phaser.Time.TimerEvent,
        trailTimer: Phaser.Time.TimerEvent,
        pulseTween: Phaser.Tweens.Tween
    ): void {
        // 停止所有定时器
        if (moveTimer) moveTimer.destroy();
        if (trailTimer) trailTimer.destroy();
        if (pulseTween) pulseTween.stop();

        // 销毁容器及其所有子元素
        if (container && container.active) {
            // 销毁容器内所有子元素
            container.each((child: Phaser.GameObjects.GameObject) => {
                if (child.active) child.destroy();
            });
            container.destroy();
        }
    }

    /**
     * 等离子球AOE爆炸效果 - 对范围内所有敌人造成伤害
     */
    private createPlasmaOrbExplosionAOE(x: number, y: number, damage: number, explosionRange: number, enemies: any[]): void {
        // 对爆炸范围内所有敌人造成伤害
        enemies.forEach(enemy => {
            if (enemy && enemy.active && enemy.takeDamage) {
                const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                if (dist < explosionRange) {
                    // 距离越远伤害越低（线性衰减）
                    const damageMultiplier = Math.max(0.5, 1 - dist / explosionRange);
                    const finalDamage = Math.floor(damage * damageMultiplier);
                    enemy.takeDamage(finalDamage);
                }
            }
        });

        // 创建爆炸特效
        this.createPlasmaOrbExplosionEffect(x, y, explosionRange);
    }

    /**
     * 等离子球爆炸特效 - 增强版AOE视觉效果
     */
    private createPlasmaOrbExplosionEffect(x: number, y: number, explosionRange: number): void {
        // 创建爆炸容器
        const explosionContainer = this.scene.add.container(x, y);
        explosionContainer.setDepth(60);

        // 1. 核心爆发
        const coreBurst = this.scene.add.circle(0, 0, 20, 0xffffff, 1);
        coreBurst.setDepth(5);
        explosionContainer.add(coreBurst);

        this.scene.tweens.add({
            targets: coreBurst,
            scale: 3,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (coreBurst.active) coreBurst.destroy();
            }
        });

        // 2. 多层爆炸波纹
        for (let i = 0; i < 4; i++) {
            const wave = this.scene.add.circle(0, 0, 15 + i * 5, 0xff66ff, 0.8 - i * 0.15);
            wave.setStrokeStyle(3, 0xff66ff, 0.9 - i * 0.2);
            wave.setDepth(4 - i);
            explosionContainer.add(wave);

            this.scene.tweens.add({
                targets: wave,
                scale: explosionRange / 15,
                alpha: 0,
                duration: 400 + i * 100,
                delay: i * 50,
                onComplete: () => {
                    if (wave.active) wave.destroy();
                }
            });
        }

        // 3. 爆炸粒子 - 向外扩散
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const particle = this.scene.add.circle(
                0, 0,
                Phaser.Math.Between(3, 7),
                Phaser.Math.Between(0, 1) === 0 ? 0xff66ff : 0xffffff,
                1
            );
            particle.setDepth(3);
            explosionContainer.add(particle);

            this.scene.tweens.add({
                targets: particle,
                x: Math.cos(angle) * explosionRange * 0.8,
                y: Math.sin(angle) * explosionRange * 0.8,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(300, 500),
                delay: i * 10,
                onComplete: () => {
                    if (particle.active) particle.destroy();
                }
            });
        }

        // 4. 能量火花
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
            const spark = this.scene.add.circle(0, 0, 2, 0xffffff, 1);
            spark.setDepth(6);
            explosionContainer.add(spark);

            this.scene.tweens.add({
                targets: spark,
                x: Math.cos(angle) * explosionRange * 0.6,
                y: Math.sin(angle) * explosionRange * 0.6,
                alpha: 0,
                scale: 0,
                duration: 200,
                delay: i * 15,
                onComplete: () => {
                    if (spark.active) spark.destroy();
                }
            });
        }

        // 5. 范围指示器（短暂显示爆炸范围）
        const rangeIndicator = this.scene.add.circle(0, 0, explosionRange, 0xff66ff, 0.1);
        rangeIndicator.setStrokeStyle(2, 0xff66ff, 0.5);
        rangeIndicator.setDepth(1);
        explosionContainer.add(rangeIndicator);

        this.scene.tweens.add({
            targets: rangeIndicator,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                if (rangeIndicator.active) rangeIndicator.destroy();
            }
        });

        // 屏幕震动
        this.scene.cameras.main.shake(150, 0.02);

        // 延迟清理容器
        this.scene.time.delayedCall(800, () => {
            if (explosionContainer && explosionContainer.active) {
                explosionContainer.each((child: Phaser.GameObjects.GameObject) => {
                    if (child.active) child.destroy();
                });
                explosionContainer.destroy();
            }
        });
    }



    /**
     * 能量新星特效 - 增强版
     */
    public createNovaEffect(x: number, y: number, range: number): void {
        // 中心爆发
        const core = this.scene.add.graphics();
        core.fillStyle(0xffaa00, 1);
        core.fillCircle(x, y, 30);
        core.setDepth(55);

        this.scene.tweens.add({
            targets: core,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => core.destroy()
        });

        // 多层能量波
        for (let i = 0; i < 4; i++) {
            const delay = i * 80;
            this.scene.time.delayedCall(delay, () => {
                const wave = this.scene.add.graphics();
                wave.lineStyle(5 - i, 0xffaa00, 1 - i * 0.15);
                wave.strokeCircle(x, y, 20);
                wave.setDepth(54);

                this.scene.tweens.add({
                    targets: wave,
                    scale: range / 20,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => wave.destroy()
                });
            });
        }

        // 光芒射线
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const ray = this.scene.add.graphics();
            ray.lineStyle(4, 0xffcc00, 0.9);
            ray.moveTo(x, y);
            ray.lineTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
            ray.strokePath();
            ray.setDepth(53);

            this.scene.tweens.add({
                targets: ray,
                scaleX: range / 20,
                scaleY: range / 20,
                alpha: 0,
                duration: 500,
                delay: i * 20,
                onComplete: () => ray.destroy()
            });
        }

        // 能量粒子爆发
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const particle = this.scene.add.circle(
                x, y,
                Phaser.Math.Between(3, 7),
                Phaser.Math.Between(0, 1) === 0 ? 0xffaa00 : 0xffcc00,
                1
            );
            particle.setDepth(56);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * range,
                y: y + Math.sin(angle) * range,
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(400, 700),
                delay: i * 15,
                onComplete: () => particle.destroy()
            });
        }

        this.scene.cameras.main.shake(200, 0.03);
        this.scene.cameras.main.flash(150, 255, 170, 0, false, undefined, this.scene);
    }

    /**
     * 音爆冲击特效
     */
    public createSonicBoomEffect(x: number, y: number, range: number): void {
        // 冲击波纹
        for (let i = 0; i < 5; i++) {
            const wave = this.scene.add.graphics();
            wave.lineStyle(4 - i * 0.5, 0x00aaff, 1 - i * 0.15);
            wave.strokeCircle(x, y, 15);
            wave.setDepth(50);

            this.scene.tweens.add({
                targets: wave,
                scale: range / 15,
                alpha: 0,
                duration: 600,
                delay: i * 60,
                onComplete: () => wave.destroy()
            });
        }

        // 声波粒子
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const particle = this.scene.add.circle(
                x, y,
                Phaser.Math.Between(4, 8),
                0x00aaff,
                1
            );
            particle.setDepth(51);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * range,
                y: y + Math.sin(angle) * range,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                delay: i * 10,
                onComplete: () => particle.destroy()
            });
        }

        // 中心闪光
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillCircle(x, y, 25);
        flash.setDepth(52);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => flash.destroy()
        });

        this.scene.cameras.main.shake(150, 0.025);
    }

    /**
     * 烈焰波特效 - 修复：使用容器坐标系防止弧线飞出
     */
    public createFlameWaveEffect(x: number, y: number, angle: number, range: number): void {
        // 创建火焰容器 - 所有元素使用相对于容器的局部坐标
        const flameContainer = this.scene.add.container(x, y);
        flameContainer.setDepth(50);

        // 火焰扇形 - 使用相对于容器的局部坐标 (0, 0)
        const flameArc = this.scene.add.graphics();
        flameArc.lineStyle(6, 0xff4400, 0.9);
        flameArc.beginPath();
        flameArc.arc(0, 0, range, angle - Math.PI / 4, angle + Math.PI / 4, false);
        flameArc.strokePath();
        flameContainer.add(flameArc);

        // 内层火焰
        const innerArc = this.scene.add.graphics();
        innerArc.lineStyle(4, 0xffaa00, 0.8);
        innerArc.beginPath();
        innerArc.arc(0, 0, range * 0.7, angle - Math.PI / 4, angle + Math.PI / 4, false);
        innerArc.strokePath();
        flameContainer.add(innerArc);

        // 核心火焰
        const coreArc = this.scene.add.graphics();
        coreArc.lineStyle(3, 0xffff00, 0.9);
        coreArc.beginPath();
        coreArc.arc(0, 0, range * 0.4, angle - Math.PI / 4, angle + Math.PI / 4, false);
        coreArc.strokePath();
        flameContainer.add(coreArc);

        // 淡出动画
        this.scene.tweens.add({
            targets: [flameArc, innerArc, coreArc],
            alpha: 0,
            scale: 1.3,
            duration: 400,
            onComplete: () => {
                flameArc.destroy();
                innerArc.destroy();
                coreArc.destroy();
            }
        });

        // 火焰粒子 - 使用相对于容器的局部坐标
        for (let i = 0; i < 20; i++) {
            const particleAngle = angle - Math.PI / 4 + (Math.PI / 2 * i) / 19;
            // 创建粒子在容器原点，然后设置相对于容器的初始位置
            const particle = this.scene.add.circle(
                0, 0,
                Phaser.Math.Between(4, 8),
                Phaser.Math.Between(0, 1) === 0 ? 0xff4400 : 0xffaa00,
                1
            );
            // 设置相对于容器的初始位置
            particle.setPosition(
                Math.cos(particleAngle) * 30,
                Math.sin(particleAngle) * 30
            );
            particle.setDepth(53);
            flameContainer.add(particle);

            // 粒子动画目标也是相对于容器的坐标
            this.scene.tweens.add({
                targets: particle,
                x: Math.cos(particleAngle) * range,
                y: Math.sin(particleAngle) * range,
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(300, 500),
                onComplete: () => particle.destroy()
            });
        }

        // 容器淡出并销毁
        this.scene.time.delayedCall(500, () => {
            this.scene.tweens.add({
                targets: flameContainer,
                alpha: 0,
                duration: 200,
                onComplete: () => flameContainer.destroy()
            });
        });

        this.scene.cameras.main.flash(100, 255, 68, 0, false, undefined, this.scene);
    }

    /**
     * 时间扭曲特效
     */
    public createTimeWarpEffect(x: number, y: number, range: number, duration: number): void {
        // 时间扭曲场
        const warpField = this.scene.add.graphics();
        warpField.lineStyle(3, 0x00ffaa, 0.6);
        warpField.strokeCircle(x, y, range);
        warpField.fillStyle(0x00ffaa, 0.1);
        warpField.fillCircle(x, y, range);
        warpField.setDepth(45);

        // 时钟指针旋转
        const clockHands = this.scene.add.graphics();
        clockHands.lineStyle(3, 0x00ffaa, 0.9);
        clockHands.lineBetween(x, y, x + range * 0.6, y);
        clockHands.lineBetween(x, y, x, y - range * 0.4);
        clockHands.setDepth(46);

        // 旋转动画
        this.scene.tweens.add({
            targets: clockHands,
            rotation: Math.PI * 2 * duration,
            duration: duration * 1000,
            onComplete: () => clockHands.destroy()
        });

        // 时间粒子
        const particleTimer = this.scene.time.addEvent({
            delay: 150,
            callback: () => {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * range;
                const particle = this.scene.add.circle(
                    x + Math.cos(angle) * dist,
                    y + Math.sin(angle) * dist,
                    Phaser.Math.Between(2, 4),
                    0x00ffaa,
                    0.7
                );
                particle.setDepth(47);

                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0.3,
                    duration: 300,
                    onComplete: () => particle.destroy()
                });
            },
            repeat: -1
        });

        // 持续时间结束后销毁
        this.scene.time.delayedCall(duration * 1000, () => {
            particleTimer.destroy();
            this.scene.tweens.add({
                targets: [warpField, clockHands],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    warpField.destroy();
                    clockHands.destroy();
                }
            });
        });

        // 脉冲效果
        this.scene.tweens.add({
            targets: warpField,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 纳米虫群特效
     */
    public createNaniteSwarmEffect(x: number, y: number, duration: number): void {
        const swarmContainer = this.scene.add.container(x, y);
        swarmContainer.setDepth(45);

        // 创建多个纳米虫
        const nanites: Phaser.GameObjects.Arc[] = [];
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 40;
            const nanite = this.scene.add.circle(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                Phaser.Math.Between(2, 4),
                0x88ff00,
                0.9
            );
            swarmContainer.add(nanite);
            nanites.push(nanite);

            // 随机移动
            this.scene.tweens.add({
                targets: nanite,
                x: nanite.x + (Math.random() - 0.5) * 60,
                y: nanite.y + (Math.random() - 0.5) * 60,
                duration: Phaser.Math.Between(500, 1000),
                yoyo: true,
                repeat: -1
            });
        }

        // 外层光环
        const aura = this.scene.add.graphics();
        aura.lineStyle(2, 0x88ff00, 0.5);
        aura.strokeCircle(0, 0, 50);
        aura.fillStyle(0x88ff00, 0.1);
        aura.fillCircle(0, 0, 50);
        swarmContainer.add(aura);

        // 脉冲动画
        this.scene.tweens.add({
            targets: aura,
            scale: 1.3,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 持续时间结束后销毁
        this.scene.time.delayedCall(duration * 1000, () => {
            this.scene.tweens.add({
                targets: swarmContainer,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                onComplete: () => swarmContainer.destroy()
            });
        });
    }

    /**
     * 能量汲取特效
     */
    public createEnergyDrainEffect(playerX: number, playerY: number, targetX: number, targetY: number): void {
        // 能量吸取线
        const drainLine = this.scene.add.graphics();
        drainLine.lineStyle(4, 0xff0066, 0.8);
        drainLine.moveTo(playerX, playerY);
        drainLine.lineTo(targetX, targetY);
        drainLine.setDepth(50);

        // 外发光
        const glowLine = this.scene.add.graphics();
        glowLine.lineStyle(8, 0xff0066, 0.3);
        glowLine.moveTo(playerX, playerY);
        glowLine.lineTo(targetX, targetY);
        glowLine.setDepth(49);

        // 能量粒子流向玩家
        for (let i = 0; i < 10; i++) {
            const t = i / 10;
            const particle = this.scene.add.circle(
                targetX + (playerX - targetX) * t,
                targetY + (playerY - targetY) * t,
                Phaser.Math.Between(3, 6),
                0xff0066,
                1
            );
            particle.setDepth(51);

            this.scene.tweens.add({
                targets: particle,
                x: playerX,
                y: playerY,
                alpha: 0,
                scale: 0.3,
                duration: 400,
                delay: i * 30,
                onComplete: () => particle.destroy()
            });
        }

        // 目标点爆发
        const targetBurst = this.scene.add.graphics();
        targetBurst.fillStyle(0xff0066, 1);
        targetBurst.fillCircle(targetX, targetY, 20);
        targetBurst.setDepth(52);

        this.scene.tweens.add({
            targets: targetBurst,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => targetBurst.destroy()
        });

        // 玩家吸收效果
        const playerAbsorb = this.scene.add.graphics();
        playerAbsorb.fillStyle(0xff0066, 0.5);
        playerAbsorb.fillCircle(playerX, playerY, 30);
        playerAbsorb.setDepth(53);

        this.scene.tweens.add({
            targets: playerAbsorb,
            alpha: 0,
            scale: 0.3,
            duration: 400,
            delay: 300,
            onComplete: () => playerAbsorb.destroy()
        });

        // 淡出线条
        this.scene.tweens.add({
            targets: [drainLine, glowLine],
            alpha: 0,
            duration: 300,
            delay: 200,
            onComplete: () => {
                drainLine.destroy();
                glowLine.destroy();
            }
        });
    }

    /**
     * 冰霜碎片特效
     */
    public createIceShardEffect(x: number, y: number, angle: number, range: number): void {
        const endX = x + Math.cos(angle) * range;
        const endY = y + Math.sin(angle) * range;

        // 冰霜碎片主体
        const shard = this.scene.add.graphics();
        shard.fillStyle(0x88ffff, 0.9);
        shard.beginPath();
        shard.moveTo(x, y);
        shard.lineTo(endX, endY);
        shard.lineTo(x + Math.cos(angle) * range * 0.8 + Math.cos(angle + Math.PI / 2) * 15, 
                     y + Math.sin(angle) * range * 0.8 + Math.sin(angle + Math.PI / 2) * 15);
        shard.closePath();
        shard.fillPath();
        shard.setDepth(50);

        // 冰霜轨迹
        const trail = this.scene.add.graphics();
        trail.lineStyle(6, 0x88ffff, 0.6);
        trail.moveTo(x, y);
        trail.lineTo(endX, endY);
        trail.strokePath();
        trail.setDepth(49);

        // 冰晶粒子
        for (let i = 0; i < 15; i++) {
            const t = i / 15;
            const px = x + (endX - x) * t;
            const py = y + (endY - y) * t;
            
            const particle = this.scene.add.circle(
                px + (Math.random() - 0.5) * 20,
                py + (Math.random() - 0.5) * 20,
                Phaser.Math.Between(2, 5),
                0x88ffff,
                0.8
            );
            particle.setDepth(51);

            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.3,
                y: particle.y + 20,
                duration: Phaser.Math.Between(300, 500),
                delay: i * 20,
                onComplete: () => particle.destroy()
            });
        }

        // 终点冰爆
        const iceBurst = this.scene.add.graphics();
        iceBurst.fillStyle(0xffffff, 1);
        iceBurst.fillCircle(endX, endY, 25);
        iceBurst.setDepth(52);

        this.scene.tweens.add({
            targets: iceBurst,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => iceBurst.destroy()
        });

        // 淡出主体
        this.scene.tweens.add({
            targets: [shard, trail],
            alpha: 0,
            duration: 400,
            onComplete: () => {
                shard.destroy();
                trail.destroy();
            }
        });

        this.scene.cameras.main.flash(80, 136, 255, 255, false, undefined, this.scene);
    }
}