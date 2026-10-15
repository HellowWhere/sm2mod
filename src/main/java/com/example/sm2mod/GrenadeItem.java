package com.example.sm2mod;

import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/** Frag grenade: throws a GrenadeEntity that bounces and explodes after ~2.5 seconds. */
public class GrenadeItem extends Item {
    public GrenadeItem(Properties props) {
        super(props);
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (!level.isClientSide) {
            GrenadeEntity grenade = new GrenadeEntity(level, player);
            grenade.setItem(new ItemStack(ModItems.FRAG_GRENADE.get()));
            grenade.shootFromRotation(player, player.getXRot(), player.getYRot(), -8.0F, 1.1F, 1.0F);
            level.addFreshEntity(grenade);
            level.playSound(null, player.blockPosition(), SoundEvents.TNT_PRIMED, SoundSource.PLAYERS, 1.0F, 1.0F);
            if (!player.getAbilities().instabuild) {
                stack.shrink(1);
            }
        }
        player.getCooldowns().addCooldown(this, 20);
        return InteractionResultHolder.sidedSuccess(stack, level.isClientSide);
    }
}
