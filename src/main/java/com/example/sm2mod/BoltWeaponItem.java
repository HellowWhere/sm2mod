package com.example.sm2mod;

import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;

/** Fires glowing bolt projectiles and consumes one Bolt Shell per shot. */
public class BoltWeaponItem extends Item {
    private final float damage;
    private final int cooldownTicks;

    public BoltWeaponItem(Properties props, double damage, int cooldownTicks) {
        super(props);
        this.damage = (float) damage;
        this.cooldownTicks = cooldownTicks;
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        ItemStack gun = player.getItemInHand(hand);
        boolean creative = player.getAbilities().instabuild;
        ItemStack ammo = findAmmo(player);
        if (ammo.isEmpty() && !creative) {
            return InteractionResultHolder.fail(gun);
        }
        if (!level.isClientSide) {
            BoltProjectile bolt = new BoltProjectile(ModEntities.BOLT.get(), player, level);
            bolt.setDamage(damage);
            bolt.shootFromRotation(player, player.getXRot(), player.getYRot(), 0.0F, 4.0F, 0.4F);
            level.addFreshEntity(bolt);

            Vec3 look = player.getLookAngle();
            if (level instanceof ServerLevel server) {
                server.sendParticles(ParticleTypes.FLAME, player.getX() + look.x * 1.0D, player.getEyeY() - 0.2D + look.y * 1.0D,
                        player.getZ() + look.z * 1.0D, 4, 0.05D, 0.05D, 0.05D, 0.01D);
                server.sendParticles(ParticleTypes.SMOKE, player.getX() + look.x * 1.0D, player.getEyeY() - 0.2D + look.y * 1.0D,
                        player.getZ() + look.z * 1.0D, 3, 0.05D, 0.05D, 0.05D, 0.01D);
            }
            level.playSound(null, player.blockPosition(), SoundEvents.GENERIC_EXPLODE, SoundSource.PLAYERS, 0.35F, 2.0F);
            if (!creative) {
                ammo.shrink(1);
            }
            gun.hurtAndBreak(1, player, p -> p.broadcastBreakEvent(hand));
        }
        player.getCooldowns().addCooldown(this, cooldownTicks);
        return InteractionResultHolder.sidedSuccess(gun, level.isClientSide);
    }

    private static ItemStack findAmmo(Player player) {
        for (ItemStack stack : player.getInventory().items) {
            if (stack.is(ModItems.BOLT_SHELL.get())) {
                return stack;
            }
        }
        return ItemStack.EMPTY;
    }
}
