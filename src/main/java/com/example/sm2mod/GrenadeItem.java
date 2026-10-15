package com.example.sm2mod;

import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.item.PrimedTnt;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/** Frag grenade: throws a short-fuse primed TNT entity. */
public class GrenadeItem extends Item {
    public GrenadeItem(Properties props) {
        super(props);
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (!level.isClientSide) {
            PrimedTnt grenade = new PrimedTnt(level, player.getX(), player.getEyeY() - 0.2D, player.getZ(), player);
            grenade.setFuse(50);
            grenade.setDeltaMovement(player.getLookAngle().scale(0.9D).add(0.0D, 0.2D, 0.0D));
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
