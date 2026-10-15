package com.example.sm2mod;

import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.AbstractArrow;
import net.minecraft.world.entity.projectile.Arrow;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/** Fires fast "bolts" (arrow entities) and consumes one Bolt Shell per shot. */
public class BoltWeaponItem extends Item {
    private final double damage;
    private final int cooldownTicks;

    public BoltWeaponItem(Properties props, double damage, int cooldownTicks) {
        super(props);
        this.damage = damage;
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
            Arrow bolt = new Arrow(level, player);
            bolt.shootFromRotation(player, player.getXRot(), player.getYRot(), 0.0F, 4.0F, 0.5F);
            bolt.setBaseDamage(damage);
            bolt.pickup = AbstractArrow.Pickup.DISALLOWED;
            level.addFreshEntity(bolt);
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
