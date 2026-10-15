package com.example.sm2mod;

import net.minecraft.core.Direction;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.protocol.Packet;
import net.minecraft.network.protocol.game.ClientGamePacketListener;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.projectile.ThrowableItemProjectile;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.EntityHitResult;
import net.minecraft.world.phys.Vec3;
import net.minecraftforge.network.NetworkHooks;

/** Thrown frag grenade: bounces, spins (custom renderer) and explodes when the fuse runs out. */
public class GrenadeEntity extends ThrowableItemProjectile {
    private int fuse = 50;

    public GrenadeEntity(EntityType<? extends GrenadeEntity> type, Level level) {
        super(type, level);
    }

    public GrenadeEntity(Level level, LivingEntity owner) {
        super(ModEntities.GRENADE.get(), owner, level);
    }

    @Override
    protected Item getDefaultItem() {
        return ModItems.FRAG_GRENADE.get();
    }

    @Override
    public Packet<ClientGamePacketListener> getAddEntityPacket() {
        return NetworkHooks.getEntitySpawningPacket(this);
    }

    @Override
    public void tick() {
        super.tick();
        if (level().isClientSide) {
            level().addParticle(ParticleTypes.SMOKE, getX(), getY() + 0.25D, getZ(), 0.0D, 0.02D, 0.0D);
            if (tickCount % 3 == 0) {
                level().addParticle(ParticleTypes.FLAME, getX(), getY() + 0.25D, getZ(), 0.0D, 0.0D, 0.0D);
            }
            return;
        }
        fuse--;
        if (fuse <= 0) {
            level().explode(this, getX(), getY(0.5D), getZ(), 3.0F, Level.ExplosionInteraction.NONE);
            discard();
        }
    }

    @Override
    protected void onHitBlock(BlockHitResult result) {
        super.onHitBlock(result);
        Vec3 v = getDeltaMovement();
        double impactSpeed = v.length();
        Direction.Axis axis = result.getDirection().getAxis();
        if (axis == Direction.Axis.X) {
            v = new Vec3(-v.x * 0.5D, v.y * 0.8D, v.z * 0.8D);
        } else if (axis == Direction.Axis.Y) {
            v = new Vec3(v.x * 0.7D, -v.y * 0.4D, v.z * 0.7D);
            if (Math.abs(v.y) < 0.06D) {
                v = new Vec3(v.x, 0.0D, v.z);
            }
        } else {
            v = new Vec3(v.x * 0.8D, v.y * 0.8D, -v.z * 0.5D);
        }
        setDeltaMovement(v);
        if (!level().isClientSide && impactSpeed > 0.25D) {
            level().playSound(null, getX(), getY(), getZ(), SoundEvents.CHAIN_HIT, SoundSource.PLAYERS, 0.8F, 1.2F);
        }
    }

    @Override
    protected void onHitEntity(EntityHitResult result) {
        super.onHitEntity(result);
        setDeltaMovement(getDeltaMovement().scale(-0.2D));
    }

    @Override
    public void addAdditionalSaveData(CompoundTag tag) {
        super.addAdditionalSaveData(tag);
        tag.putInt("Fuse", fuse);
    }

    @Override
    public void readAdditionalSaveData(CompoundTag tag) {
        super.readAdditionalSaveData(tag);
        if (tag.contains("Fuse")) {
            fuse = tag.getInt("Fuse");
        }
    }
}
