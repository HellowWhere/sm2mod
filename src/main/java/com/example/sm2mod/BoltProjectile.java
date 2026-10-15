package com.example.sm2mod;

import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.protocol.Packet;
import net.minecraft.network.protocol.game.ClientGamePacketListener;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.projectile.ThrowableProjectile;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.EntityHitResult;
import net.minecraft.world.phys.Vec3;
import net.minecraftforge.network.NetworkHooks;

/** Mass-reactive bolt: a glowing, gravity-free projectile with a flame trail (NOT an arrow). */
public class BoltProjectile extends ThrowableProjectile {
    private float damage = 6.0F;

    public BoltProjectile(EntityType<? extends BoltProjectile> type, Level level) {
        super(type, level);
    }

    public BoltProjectile(EntityType<? extends BoltProjectile> type, LivingEntity owner, Level level) {
        super(type, owner, level);
    }

    public void setDamage(float damage) {
        this.damage = damage;
    }

    public float getDamage() {
        return damage;
    }

    @Override
    protected void defineSynchedData() {
    }

    @Override
    protected float getGravity() {
        return 0.0F;
    }

    protected int maxLife() {
        return 40;
    }

    @Override
    public Packet<ClientGamePacketListener> getAddEntityPacket() {
        return NetworkHooks.getEntitySpawningPacket(this);
    }

    @Override
    public void tick() {
        super.tick();
        if (level().isClientSide) {
            trail();
        } else if (tickCount > maxLife()) {
            discard();
        }
    }

    /** Client-side particle trail. */
    protected void trail() {
        Vec3 v = getDeltaMovement();
        for (int i = 0; i < 3; i++) {
            double f = i / 3.0D;
            level().addParticle(ParticleTypes.FLAME, getX() - v.x * f, getY() - v.y * f, getZ() - v.z * f, 0.0D, 0.0D, 0.0D);
        }
        level().addParticle(ParticleTypes.SMOKE, getX(), getY(), getZ(), 0.0D, 0.0D, 0.0D);
    }

    @Override
    protected void onHitEntity(EntityHitResult result) {
        super.onHitEntity(result);
        if (level().isClientSide) {
            return;
        }
        Entity target = result.getEntity();
        target.invulnerableTime = 0;
        target.hurt(damageSources().thrown(this, getOwner()), damage);
        afterHit(target);
        impact();
    }

    @Override
    protected void onHitBlock(BlockHitResult result) {
        super.onHitBlock(result);
        if (!level().isClientSide) {
            impact();
        }
    }

    protected void afterHit(Entity target) {
    }

    /** Server-side impact effects, then remove the projectile. */
    protected void impact() {
        if (level() instanceof ServerLevel server) {
            server.sendParticles(ParticleTypes.FLAME, getX(), getY(), getZ(), 12, 0.12D, 0.12D, 0.12D, 0.06D);
            server.sendParticles(ParticleTypes.SMOKE, getX(), getY(), getZ(), 6, 0.1D, 0.1D, 0.1D, 0.02D);
            server.sendParticles(ParticleTypes.FLASH, getX(), getY(), getZ(), 1, 0.0D, 0.0D, 0.0D, 0.0D);
            server.playSound(null, getX(), getY(), getZ(), SoundEvents.GENERIC_EXPLODE, SoundSource.PLAYERS, 0.5F, 1.8F);
        }
        discard();
    }
}
