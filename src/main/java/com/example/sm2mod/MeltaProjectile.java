package com.example.sm2mod;

import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.level.Level;

/** Short-range superheated blast: dense flames, big damage, sets targets on fire. */
public class MeltaProjectile extends BoltProjectile {
    public MeltaProjectile(EntityType<? extends MeltaProjectile> type, Level level) {
        super(type, level);
    }

    public MeltaProjectile(EntityType<? extends MeltaProjectile> type, LivingEntity owner, Level level) {
        super(type, owner, level);
    }

    @Override
    protected int maxLife() {
        return 14;
    }

    @Override
    protected void trail() {
        for (int i = 0; i < 5; i++) {
            level().addParticle(ParticleTypes.FLAME,
                    getX() + (random.nextDouble() - 0.5D) * 0.4D,
                    getY() + (random.nextDouble() - 0.5D) * 0.4D,
                    getZ() + (random.nextDouble() - 0.5D) * 0.4D,
                    0.0D, 0.0D, 0.0D);
        }
        level().addParticle(ParticleTypes.LARGE_SMOKE, getX(), getY(), getZ(), 0.0D, 0.0D, 0.0D);
    }

    @Override
    protected void afterHit(Entity target) {
        target.setSecondsOnFire(6);
    }

    @Override
    protected void impact() {
        if (level() instanceof ServerLevel server) {
            server.sendParticles(ParticleTypes.FLAME, getX(), getY(), getZ(), 35, 0.3D, 0.3D, 0.3D, 0.08D);
            server.sendParticles(ParticleTypes.LAVA, getX(), getY(), getZ(), 10, 0.3D, 0.3D, 0.3D, 0.0D);
            server.sendParticles(ParticleTypes.LARGE_SMOKE, getX(), getY(), getZ(), 8, 0.2D, 0.2D, 0.2D, 0.02D);
            server.playSound(null, getX(), getY(), getZ(), SoundEvents.FIRECHARGE_USE, SoundSource.PLAYERS, 1.0F, 0.7F);
        }
        discard();
    }
}
